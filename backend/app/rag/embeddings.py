from sentence_transformers import SentenceTransformer
import traceback

# Lazy load the model to prevent Uvicorn deadlocks on Windows during reload
_model = None

def get_model():
    global _model
    if _model is None:
        print("Loading local SentenceTransformer model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Model loaded successfully!")
    return _model

def get_embedding(text: str) -> list[float]:
    try:
        embedding = get_model().encode(text)
        return embedding.tolist()
    except Exception as e:
        print(f"Embedding error: {e}")
        traceback.print_exc()
        raise

def get_embeddings(texts: list[str]) -> list[list[float]]:
    try:
        embeddings = get_model().encode(texts)
        return [e.tolist() for e in embeddings]
    except Exception as e:
        print(f"Embeddings error: {e}")
        traceback.print_exc()
        raise
