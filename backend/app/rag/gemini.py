import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

def generate_rag_response(query: str, context: str) -> str:
    """
    Generate a response using Gemini based on the provided context.
    """
    prompt = f"""
    You are EduRAG AI, a helpful AI assistant. Answer the user's question based strictly on the context provided below.
    If the context does not contain the answer, say "I don't have enough information to answer that based on the provided documents."

    Context:
    {context}

    User Question:
    {query}
    """
    
    response = model.generate_content(prompt)
    return response.text
