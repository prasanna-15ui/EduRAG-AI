"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const supabase = createClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = () => {
    setFile(null);
    setProgress(0);
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10); // Start progress

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Create FormData to send file to FastAPI backend
      const formData = new FormData();
      formData.append('file', file);
      
      setProgress(50); // Preparing upload

      const token = session.access_token;
      
      // Upload and process via FastAPI backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to process document");
      }

      setProgress(100);
      toast.success("Document uploaded and processed successfully!");
      setFile(null);
      onUploadSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="w-full space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors text-center",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            isDragReject && "border-destructive bg-destructive/5"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className={cn("w-12 h-12 mb-4 text-muted-foreground", isDragActive && "text-primary")} />
          <h3 className="text-lg font-semibold mb-1">Drag & Drop your document here</h3>
          <p className="text-sm text-muted-foreground mb-4">or click to browse from your computer</p>
          <p className="text-xs text-muted-foreground">Supported files: PDF, DOCX, TXT (Max 10MB)</p>
        </div>
      ) : (
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <File className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!uploading && (
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="w-5 h-5 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
          
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>{progress === 100 ? "Processing complete" : "Uploading and processing..."}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {!uploading && (
            <Button className="w-full" onClick={uploadFile}>
              Upload and Process
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
