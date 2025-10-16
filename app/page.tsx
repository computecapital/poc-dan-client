"use client"

import { useState } from "react"
import { ConversationList } from "@/components/conversation-list"
import { ChatView } from "@/components/chat-view"

export default function HomePage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ConversationList selectedGroupId={selectedGroupId} onSelectGroup={setSelectedGroupId} />
      <ChatView groupId={selectedGroupId} />
    </div>
  )
}
