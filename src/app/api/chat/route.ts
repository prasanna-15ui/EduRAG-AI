import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Pinecone } from "@pinecone-database/pinecone";
import Groq from "groq-sdk";

export async function POST(request: Request) {
  try {
    console.log("========== CHAT API START ==========");

    // Check environment variables
    console.log("Groq Key:", !!process.env.GROQ_API_KEY);
    console.log("Pinecone Key:", !!process.env.PINECONE_API_KEY);
    console.log("Supabase URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const { messages, sessionId, isNewSession } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() { },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const latestMessage = messages[messages.length - 1].content;

    console.log("User Message:", latestMessage);

    // Backend URL
    const backendUrl = (
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://127.0.0.1:8000"
    ).replace("localhost", "127.0.0.1");

    console.log("Backend URL:", backendUrl);

    // Get embedding
    const embedRes = await fetch(`${backendUrl}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: latestMessage,
      }),
    });

    if (!embedRes.ok) {
      throw new Error("Embedding API failed.");
    }

    const { embedding: queryEmbedding } = await embedRes.json();

    console.log("Embedding generated successfully.");
    // Search Pinecone
    const pineconeIndex = pinecone.Index(
      process.env.PINECONE_INDEX_NAME!
    );

    const queryResponse = await pineconeIndex.query({
      vector: queryEmbedding as number[],
      topK: 5,
      includeMetadata: true,
      filter: {
        userId: session.user.id,
      },
    });

    console.log("Pinecone search completed.");

    const contexts =
      queryResponse.matches
        ?.map((match: any) => match.metadata?.text)
        .join("\n\n----------------\n\n") || "";

    const sourceTitles = Array.from(
      new Set(
        queryResponse.matches
          ?.map((match: any) => match.metadata?.title)
          .filter(Boolean)
      )
    );

    console.log("Sources:", sourceTitles);

    const systemPrompt = `
You are EduRAG AI.

Answer ONLY using the provided context.

If the answer is not present in the context,
say:

"I couldn't find that information in your uploaded documents."

Always answer in Markdown.

Context:

${contexts || "No relevant context found."}
`;

    const groqMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: `User Question:\n\n${latestMessage}` }
    ];

    console.log("Sending request to Groq...");

    const streamCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile", // Using a currently supported Groq model
      stream: true,
    });

    console.log("Groq response stream started.");

    let currentSessionId = sessionId;

    if (isNewSession || !currentSessionId) {
      const { data: newSession } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: session.user.id,
          title: latestMessage.substring(0, 30) + "...",
        })
        .select()
        .single();

      if (newSession) {
        currentSessionId = newSession.id;
      }
    }

    if (currentSessionId) {
      await supabase.from("messages").insert({
        session_id: currentSessionId,
        role: "user",
        content: latestMessage,
      });
    }
    // Create streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          // Send session ID first
          if (currentSessionId) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  sessionId: currentSessionId,
                })}\n\n`
              )
            );
          }

          // Stream Groq response
          for await (const chunk of streamCompletion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              fullResponse += text;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    text,
                  })}\n\n`
                )
              );
            }
          }

          // Send sources
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                sources: sourceTitles,
              })}\n\n`
            )
          );

          // Save assistant response
          if (currentSessionId) {
            await supabase.from("messages").insert({
              session_id: currentSessionId,
              role: "assistant",
              content: fullResponse,
              source_documents: sourceTitles,
            });
          }

          console.log("Chat completed successfully.");
        } catch (streamError: any) {
          console.error("STREAM ERROR");
          console.error(streamError);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: streamError.message,
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    // Return stream
    // Return stream
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (error: any) {

    console.error("=================================");
    console.error("CHAT API ERROR");
    console.error(error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}