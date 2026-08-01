"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Trash2, FileText, File, FileType2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "@/components/document-upload";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  file_path: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this document? This will also remove its data from the AI's knowledge base.")) return;
    
    setDeletingId(id);
    try {
      // API call to delete from Pinecone, DB, and Storage
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document deleted successfully");
      setDocuments(docs => docs.filter(doc => doc.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-medium">Ready</span>;
      case 'processing':
        return <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-medium flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Processing</span>;
      case 'error':
        return <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/10 text-gray-500 rounded text-xs font-medium">Pending</span>;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileType2 className="w-5 h-5 text-red-500" />;
    if (type.includes('doc')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-2">
          Manage the knowledge base for your AI assistant. Upload new documents or remove old ones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>
                Add new context to your AI assistant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload onUploadSuccess={fetchDocuments} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Your Knowledge Base</CardTitle>
              <CardDescription>
                Files currently indexed and available for chat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No documents yet</h3>
                  <p className="text-sm text-muted-foreground">Upload your first document to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div className="p-2 bg-muted rounded-lg">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px] md:max-w-xs" title={doc.title}>
                            {doc.title}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground space-x-2 mt-1">
                            <span>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                            <span>•</span>
                            <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                            <span>•</span>
                            {getStatusBadge(doc.status)}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc.id, doc.file_path)}
                        disabled={deletingId === doc.id}
                        className="text-muted-foreground hover:text-destructive self-end sm:self-auto"
                      >
                        {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
