from sentence_transformers import SentenceTransformer
import os

# Initialize the model (downloads it locally on first run)
# 'all-MiniLM-L6-v2' maps to 384 dimensions, which should match your Pinecone index.
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> list[float]:
    # Returns a list of floats
    embedding = model.encode(text)
    return embedding.tolist()

def get_embeddings(texts: list[str]) -> list[list[float]]:
    embeddings = model.encode(texts)
    return embeddings.tolist()
