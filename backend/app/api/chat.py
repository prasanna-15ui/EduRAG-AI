from fastapi import APIRouter, Depends, HTTPException
from app.schemas import ChatRequest, ChatResponse
from app.dependencies import get_current_user
from app.database import supabase_admin
from app.rag.embeddings import get_embedding
from app.rag.retriever import query_vectors
from app.rag.gemini import generate_rag_response
import uuid

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user"].id
    session_id = request.session_id

    # Create session if it doesn't exist
    if not session_id:
        session_res = supabase_admin.table("chat_sessions").insert({
            "user_id": user_id,
            "title": request.message[:50] + "..." if len(request.message) > 50 else request.message
        }).execute()
        if not session_res.data:
            raise HTTPException(status_code=500, detail="Could not create chat session")
        session_id = session_res.data[0]["id"]

    # 1. Generate embedding for user query
    try:
        query_embedding = get_embedding(request.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

    # 2. Retrieve relevant context from Pinecone
    try:
        matches = query_vectors(query_embedding, top_k=5, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector retrieval failed: {str(e)}")

    context_texts = []
    source_docs = []
    for match in matches:
        metadata = match.get("metadata", {})
        text = metadata.get("text", "")
        if text:
            context_texts.append(text)
            source_docs.append({
                "title": metadata.get("title", "Unknown"),
                "chunkIndex": metadata.get("chunkIndex", -1),
                "score": match.get("score", 0)
            })

    context_str = "\n\n---\n\n".join(context_texts)

    # 3. Generate response using Gemini
    try:
        ai_response = generate_rag_response(request.message, context_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # 4. Save messages to Supabase
    # Save User message
    supabase_admin.table("messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": request.message
    }).execute()

    # Save Assistant message
    supabase_admin.table("messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": ai_response,
        "source_documents": source_docs
    }).execute()

    return {
        "session_id": session_id,
        "response": ai_response,
        "source_documents": source_docs
    }
