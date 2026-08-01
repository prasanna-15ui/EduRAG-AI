import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata = {
  title: "Shared Chat | EduRAG AI",
};

interface SharePageProps {
  params: {
    id: string;
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;

  if (!id) return notFound();

  const supabase = createAdminClient();

  // Fetch the chat session
  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("*, profiles(full_name)")
    .eq("id", id)
    .single();

  if (sessionError || !session || !session.is_shared) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="mt-4 text-muted-foreground">
            This chat session does not exist or has not been shared.
          </p>
        </div>
      </div>
    );
  }

  // Fetch messages
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return notFound();
  }

  const authorName = session.profiles?.full_name || "A user";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-primary" />
          <h1 className="font-semibold text-lg">EduRAG AI</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Shared by <span className="font-medium text-foreground">{authorName}</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8">
        <div className="space-y-6 pb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">{session.title}</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Started on {new Date(session.created_at).toLocaleDateString()}
            </p>
          </div>

          {messages?.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-4 max-w-[85%]",
                message.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted border text-foreground"
                )}
              >
                {message.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={cn(
                  "px-5 py-4 rounded-2xl",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm border"
                )}
              >
                <div
                  className={cn(
                    "prose prose-sm dark:prose-invert max-w-none break-words",
                    message.role === "user" &&
                      "text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground"
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
