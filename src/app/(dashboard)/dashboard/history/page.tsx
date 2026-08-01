"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { MessageSquare, Trash2, Loader2, ArrowRight, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSessions() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Try fetching with is_pinned sorting first
      let { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("is_pinned", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });

      // If the column doesn't exist (user hasn't run SQL migration), fallback to standard query
      if (error && error.code === '42703') {
        console.warn("is_pinned column not found. Falling back to standard query. Please run the SQL migration.");
        const fallback = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("user_id", session.user.id)
          .order("updated_at", { ascending: false });
          
        data = fallback.data;
        error = fallback.error;
      } else if (error) {
        console.error("Error fetching sessions:", error);
      }

      if (data) {
        setSessions(data);
      }
      setLoading(false);
    }
    fetchSessions();
  }, [supabase]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this chat session?")) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Chat session deleted");
      setSessions(s => s.filter(session => session.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePinToggle = async (session: ChatSession, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setPinningId(session.id);
    const newPinStatus = !session.is_pinned;
    
    try {
      const res = await fetch("/api/chat/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, isPinned: newPinStatus }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to pin chat");
      
      // Update local state and re-sort
      setSessions(s => {
        const updated = s.map(sess => sess.id === session.id ? { ...sess, is_pinned: newPinStatus } : sess);
        return updated.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      });
      
      toast.success(newPinStatus ? "Chat pinned" : "Chat unpinned");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPinningId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat History</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your past conversations with the AI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>
            Click on a session to continue the chat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No chat history</h3>
              <p className="text-sm text-muted-foreground mb-4">You haven't started any conversations yet.</p>
              <Link href="/chat">
                <Button>Start a New Chat</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link key={session.id} href={`/chat/${session.id}`} className="block">
                  <div className={cn(
                    "flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-all group",
                    session.is_pinned ? "bg-muted/20 border-primary/20" : ""
                  )}>
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        session.is_pinned 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      )}>
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{session.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(session.updated_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "transition-opacity",
                          session.is_pinned ? "opacity-100 text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary"
                        )}
                        onClick={(e) => handlePinToggle(session, e)}
                        disabled={pinningId === session.id}
                        title={session.is_pinned ? "Unpin chat" : "Pin chat"}
                      >
                        {pinningId === session.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Pin className="w-4 h-4" fill={session.is_pinned ? "currentColor" : "none"} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(session.id, e)}
                        disabled={deletingId === session.id}
                      >
                        {deletingId === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                      <div className="p-2 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
