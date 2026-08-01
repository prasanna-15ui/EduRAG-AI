import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Pinecone } from "@pinecone-database/pinecone";



export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! || "dummy" });
  try {
    const { id: documentId } = await params;
    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch (error) {}
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership and get file path
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", session.user.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 1. Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([doc.file_path]);

    if (storageError) console.error("Storage delete error:", storageError);

    // 2. Delete from Pinecone (Vector DB)
    try {
      const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
      // Delete all chunks for this document by deleting all vectors where metadata.documentId == doc.id
      // Note: pinecone allows deleting by metadata filter or we can delete by ID if we have all chunk IDs.
      // Easiest is metadata filter, but free tier might have limitations depending on the pod/serverless.
      // We will try deleting by filter.
      // @ts-ignore
      await pineconeIndex.deleteMany({ documentId: doc.id });
    } catch (pcError) {
      console.error("Pinecone delete error:", pcError);
    }

    // 3. Delete from Supabase DB (Cascade will delete document_chunks)
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete document" }, { status: 500 });
  }
}
