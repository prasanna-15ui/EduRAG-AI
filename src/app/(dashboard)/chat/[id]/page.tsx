import { ChatUI } from "@/components/chat-ui";

export default async function ExistingChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="h-full flex flex-col">
      <ChatUI isNewSession={false} initialSessionId={id} />
    </div>
  );
}
