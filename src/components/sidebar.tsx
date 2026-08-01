"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, FileText, Settings, User, History, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    title: "Chat History",
    href: "/dashboard/history",
    icon: <History className="w-5 h-5" />,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: <User className="w-5 h-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-muted/40 border-r px-4 py-6">
      <div className="flex items-center space-x-2 mb-10 px-2">
        <Bot className="h-8 w-8 text-primary" />
        <span className="font-bold text-xl tracking-tight">EduRAG</span>
      </div>

      <div className="mb-8">
        <Link href="/chat">
          <div className="flex items-center space-x-2 w-full justify-start px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
            <MessageSquarePlus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {sidebarNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              pathname === item.href || pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
