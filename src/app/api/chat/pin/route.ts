import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, isPinned } = await req.json();

    if (!sessionId || typeof isPinned !== "boolean") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the session to toggle pinned state
    // RLS ensures the user can only update their own sessions.
    const { error } = await supabase
      .from("chat_sessions")
      .update({ is_pinned: isPinned })
      .eq("id", sessionId);

    if (error) {
      console.error("Error pinning chat:", error);
      
      // Give a helpful error if the column doesn't exist yet
      if (error.code === '42703') { // undefined_column
        return NextResponse.json(
          { error: "Database needs updating. Please run the SQL command to add the is_pinned column." },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ error: "Failed to update pinned status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, isPinned });
  } catch (error: any) {
    console.error("Error in pin route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
