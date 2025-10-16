"use client";

import type React from "react";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/message-bubble";
import { Loader2 } from "lucide-react";

interface Attachment {
  id: string;
  kind: string;
  mimeType: string;
  path: string;
  transcript?: string;
  description?: string;
  durationSec?: number;
  bytes?: number;
}

interface Message {
  id: string;
  whatsappMsgId: string;
  groupId: string;
  fromName: string;
  fromNumber: string;
  type: string;
  text?: string;
  replyToWhatsappMsgId?: string;
  sentAt: string;
  createdAt: string;
  attachments: Attachment[];
  repliedMessage?: {
    id: string;
    whatsappMsgId: string;
    fromName: string;
    fromNumber: string;
    type: string;
    text?: string;
    sentAt: string;
  };
}

interface MessageListProps {
  groupId: string;
}

export function MessageList({ groupId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(
    async (pageNum: number, scrollToBottom: boolean) => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/messages?page=${pageNum}&limit=50`
        );
        const data = await response.json();

        const received = (data.data || []) as Message[];
        const normalized = [...received].reverse(); // garantir mais antigo -> mais novo

        if (pageNum === 1) {
          setMessages(normalized);
        } else {
          const viewport = (scrollRef.current?.querySelector(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLDivElement) || null;
          const prevHeight = viewport?.scrollHeight || 0;

          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const toAdd = normalized.filter((m) => !existingIds.has(m.id));
            // prepend mais antigas para o topo, mantendo ordem ascendente
            return [...toAdd, ...prev];
          });

          // preservar posição visual após inserir no topo
          setTimeout(() => {
            const newHeight = viewport?.scrollHeight || 0;
            if (viewport) viewport.scrollTop = newHeight - prevHeight;
          }, 0);
        }

        setHasMore(data.pagination?.hasNext || false);

        if (scrollToBottom) {
          setTimeout(() => {
            bottomRef.current?.scrollIntoView();
          }, 50);
        }
      } catch (error) {
        console.error("[v0] Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    fetchMessages(1, true);
  }, [groupId, fetchMessages]);

  useEffect(() => {
    if (page > 1) {
      fetchMessages(page, false);
    }
  }, [page, fetchMessages]);

  useEffect(() => {
    const socket = getSocket();

    const handleMessageCreated = (message: Message) => {
      if (message.groupId !== groupId) return;
      setMessages((prev) => {
        // Evita duplicar se já estiver na lista
        if (prev.some((m) => m.id === message.id)) return prev;
        const next = [...prev, message];
        // rolar suavemente para o fim sem loading grande
        requestAnimationFrame(() => {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        });
        return next;
      });
    };

    socket.on("message:created", handleMessageCreated);
    return () => {
      socket.off("message:created", handleMessageCreated);
    };
  }, [groupId]);

  // Radix ScrollArea: o scroll acontece no Viewport, então ouvimos diretamente nele
  useEffect(() => {
    const viewport = (scrollRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLDivElement) || null;
    if (!viewport) return;

    const onScroll = () => {
      if (viewport.scrollTop <= 0 && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    };

    viewport.addEventListener("scroll", onScroll);
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [hasMore, loading]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea
      className="flex-1 px-4 py-0 h-full min-h-0"
      ref={scrollRef}
    >
      {loading && messages.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="space-y-4 max-w-full mx-auto my-6">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            previousMessage={index > 0 ? messages[index - 1] : undefined}
          />
        ))}
      </div>

      <div ref={bottomRef} />
    </ScrollArea>
  );
}
