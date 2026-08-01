import Link from "next/link";
import { Bot } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="mb-8 flex justify-center">
        <Link href="/" className="flex items-center space-x-2 text-foreground">
          <Bot className="h-10 w-10 text-primary" />
          <span className="font-bold text-3xl tracking-tight">EduRAG AI</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
