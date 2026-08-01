import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the session to be shared. 
    // RLS ensures the user can only update their own sessions.
    const { error } = await supabase
      .from("chat_sessions")
      .update({ is_shared: true })
      .eq("id", sessionId);

    if (error) {
      console.error("Error sharing chat:", error);
      
      // Give a helpful error if the column doesn't exist yet
      if (error.code === '42703') { // undefined_column
        return NextResponse.json(
          { error: "Database needs updating. Please run the SQL command to add the is_shared column." },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ error: "Failed to share chat" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in share route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
