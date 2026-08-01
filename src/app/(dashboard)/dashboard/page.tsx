"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardOverview() {
  const [stats, setStats] = useState({ documents: 0, chats: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [docsResponse, chatsResponse] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact" }).eq("user_id", session.user.id),
        supabase.from("chat_sessions").select("id", { count: "exact" }).eq("user_id", session.user.id)
      ]);

      setStats({
        documents: docsResponse.count || 0,
        chats: chatsResponse.count || 0,
      });
      setLoading(false);
    }
    loadStats();
  }, [supabase]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your EduRAG dashboard. Manage your knowledge base and chat history here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.documents}</div>
            <p className="text-xs text-muted-foreground mt-1">Uploaded to your knowledge base</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.chats}</div>
            <p className="text-xs text-muted-foreground mt-1">Total conversations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/documents" className="block">
              <div className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="p-2 bg-primary/10 text-primary rounded-full mr-4">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Upload Document</h3>
                  <p className="text-sm text-muted-foreground">Add new files to your knowledge base</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
            
            <Link href="/chat" className="block">
              <div className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="p-2 bg-primary/10 text-primary rounded-full mr-4">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Start New Chat</h3>
                  <p className="text-sm text-muted-foreground">Ask questions about your documents</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
