from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import uuid
import traceback

from app.dependencies import get_current_user
from app.database import supabase_admin
from app.rag.chunking import extract_text_from_bytes, chunk_text
from app.rag.embeddings import get_embeddings
from app.rag.retriever import upsert_vectors

router = APIRouter()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        # Get user id safely
        if isinstance(current_user, dict):
            if "user" in current_user:
                user = current_user["user"]
                if isinstance(user, dict):
                    user_id = user.get("id")
                else:
                    user_id = getattr(user, "id", None)
            else:
                user_id = current_user.get("id")
        else:
            user_id = getattr(current_user, "id", None)

        if not user_id:
            raise HTTPException(status_code=401, detail="Unable to determine user ID.")

        # Read file
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        file_ext = file.filename.split(".")[-1].lower()

        if file_ext not in ["pdf", "doc", "docx", "txt"]:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Use PDF, DOCX, DOC or TXT."
            )

        file_size = len(file_bytes)
        file_path = f"{user_id}/{uuid.uuid4()}.{file_ext}"

        # Upload to Supabase Storage
        try:
            supabase_admin.storage.from_("documents").upload(
                file_path,
                file_bytes,
                {"content-type": file.content_type},
            )
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Storage upload failed: {str(e)}"
            )

        # Insert document record
        doc_res = (
            supabase_admin.table("documents")
            .insert(
                {
                    "user_id": user_id,
                    "title": file.filename,
                    "file_path": file_path,
                    "file_type": file_ext,
                    "file_size": file_size,
                    "status": "processing",
                }
            )
            .execute()
        )

        if not doc_res.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create document record."
            )

        doc_id = doc_res.data[0]["id"]

        # Extract text
        text = extract_text_from_bytes(file_bytes, file_ext)

        if not text or not text.strip():
            raise Exception("No text could be extracted from the document.")

        # Chunk text
        chunks = chunk_text(text)

        if not chunks:
            raise Exception("No chunks were created from the document.")

        # Generate embeddings
        embeddings = get_embeddings(chunks)

        vectors = []
        db_chunks = []

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{doc_id}-chunk-{i}"

            vectors.append(
                {
                    "id": chunk_id,
                    "values": embedding,
                    "metadata": {
                        "documentId": doc_id,
                        "userId": user_id,
                        "text": chunk,
                        "title": file.filename,
                        "chunkIndex": i,
                    },
                }
            )

            db_chunks.append(
                {
                    "document_id": doc_id,
                    "chunk_index": i,
                    "content": chunk,
                }
            )

        # Upload vectors
        batch_size = 100

        for i in range(0, len(vectors), batch_size):
            upsert_vectors(vectors[i : i + batch_size])

        # Save chunks
        for i in range(0, len(db_chunks), batch_size):
            (
                supabase_admin.table("document_chunks")
                .insert(db_chunks[i : i + batch_size])
                .execute()
            )

        # Mark completed
        (
            supabase_admin.table("documents")
            .update({"status": "completed"})
            .eq("id", doc_id)
            .execute()
        )

        return {
            "message": "Document uploaded successfully.",
            "document": doc_res.data[0],
        }

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()

        try:
            if "doc_id" in locals():
                (
                    supabase_admin.table("documents")
                    .update({"status": "error"})
                    .eq("id", doc_id)
                    .execute()
                )
        except Exception:
            traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )