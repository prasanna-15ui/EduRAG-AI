"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Bot, User, Loader2, Copy, Check, Info, Mic, MicOff, Volume2, VolumeX, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatUIProps {
  isNewSession?: boolean;
  initialSessionId?: string;
}

export function ChatUI({ isNewSession = true, initialSessionId }: ChatUIProps) {
  const router = useRouter();
  const supabase = createClient();
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error(e);
      toast.error("Could not start speech recognition.");
    }
  };

  useEffect(() => {
    // Cleanup speech synthesis on unmount
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeak = (text: string, id: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleShare = async () => {
    if (!sessionId) return;
    
    setIsSharing(true);
    try {
      const res = await fetch("/api/chat/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to share chat");
      }
      
      const shareUrl = `${window.location.origin}/share/${sessionId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSharing(false);
    }
  };

  // Load initial messages if it's an existing session
  useEffect(() => {
    async function loadMessages() {
      if (!isNewSession && initialSessionId) {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("session_id", initialSessionId)
          .order("created_at", { ascending: true });

        if (data) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));
          setMessages(formattedMessages);
        }
      }
    }
    loadMessages();
  }, [isNewSession, initialSessionId, supabase]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          sessionId,
          isNewSession: isNewSession && !sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let assistantMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };
      setMessages([...newMessages, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.sessionId && !sessionId) {
                  setSessionId(data.sessionId);
                }
                if (data.text) {
                  assistantMessage.content += data.text;
                  setMessages([...newMessages, { ...assistantMessage }]);
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] max-w-4xl mx-auto w-full border rounded-xl shadow-sm bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">EduRAG Assistant</h2>
        </div>
        {sessionId && (
          <div className="flex items-center space-x-4">
            <div className="text-xs text-muted-foreground flex items-center hidden sm:flex">
              <Info className="w-3 h-3 mr-1" />
              Context-aware chat
            </div>
            <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing} className="h-8">
              {isSharing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Share className="w-3.5 h-3.5 mr-2" />}
              Share
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium">How can I help you today?</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Ask me anything about the documents in your knowledge base. I'll search for the most relevant information and provide an accurate answer.
            </p>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {messages.map((message) => (
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
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border text-foreground"
                  )}
                >
                  {message.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div
                  className={cn(
                    "relative group px-5 py-4 rounded-2xl",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm border"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="absolute -right-[4.5rem] top-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => copyToClipboard(message.content, message.id)}
                        title="Copy to clipboard"
                      >
                        {copiedId === message.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 text-muted-foreground", speakingId === message.id && "text-primary bg-primary/10")}
                        onClick={() => toggleSpeak(message.content, message.id)}
                        title={speakingId === message.id ? "Stop speaking" : "Read aloud"}
                      >
                        {speakingId === message.id ? <VolumeX className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                  <div className={cn(
                    "prose prose-sm dark:prose-invert max-w-none break-words",
                    message.role === "user" && "text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground"
                  )}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-muted border rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-foreground" />
                </div>
                <div className="px-5 py-4 bg-muted border rounded-2xl rounded-tl-sm flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-background border-t">
        <form
          onSubmit={handleSubmit}
          className="flex items-center space-x-2 relative"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="flex-1 pr-24 rounded-full h-12 bg-muted/50 border-muted focus-visible:ring-primary"
            disabled={isLoading}
          />
          <div className="absolute right-1 flex items-center space-x-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={toggleListening}
              className={cn("rounded-full h-10 w-10", isListening && "text-red-500 hover:text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50")}
            >
              {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-full h-10 w-10"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
            </Button>
          </div>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground">
            AI can make mistakes. Consider verifying important information.
          </p>
        </div>
      </div>
    </div>
  );
}
