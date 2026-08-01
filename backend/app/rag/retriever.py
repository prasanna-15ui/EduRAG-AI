from pinecone import Pinecone
from app.config import settings

pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX)

def upsert_vectors(vectors: list[dict]):
    """
    vectors: list of dicts with 'id', 'values', 'metadata'
    """
    index.upsert(vectors=vectors)

def query_vectors(embedding: list[float], top_k: int = 5, user_id: str = None) -> list[dict]:
    """
    Query Pinecone for similar vectors. Optionally filter by user_id to ensure
    users only query their own documents.
    """
    filter_dict = {}
    if user_id:
        filter_dict["userId"] = user_id

    response = index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
        filter=filter_dict if filter_dict else None
    )
    
    results = []
    for match in response.matches:
        results.append({
            "id": match.id,
            "score": match.score,
            "metadata": match.metadata
        })
    return results
