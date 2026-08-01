# EduRAG AI - FastAPI Backend

This is the Python backend for EduRAG AI. It provides APIs for authentication, document processing (RAG), and chat integrations using Supabase, Pinecone, Hugging Face, and Google Gemini.

## Setup Instructions

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # on Mac/Linux
   # or venv\Scripts\activate on Windows
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in your keys.

5. **Start server**:
   ```bash
   uvicorn app.main:app --reload
   ```
