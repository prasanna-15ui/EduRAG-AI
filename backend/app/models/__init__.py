# Dataclasses or type hints for Supabase responses

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

class DocumentModel(BaseModel):
    id: str
    user_id: str
    title: str
    file_path: str
    file_type: str
    file_size: int
    status: str
    created_at: datetime
    updated_at: datetime

class ChatSessionModel(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime

class MessageModel(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    source_documents: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
