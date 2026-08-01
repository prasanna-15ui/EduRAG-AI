"use client";

import { ChatUI } from "@/components/chat-ui";

export default function NewChatPage() {
  return (
    <div className="h-full flex flex-col">
      <ChatUI isNewSession={true} />
    </div>
  );
}
