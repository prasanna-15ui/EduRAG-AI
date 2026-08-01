import io
import PyPDF2
import mammoth

def extract_text_from_bytes(file_bytes: bytes, file_type: str) -> str:
    text = ""
    if file_type == "pdf":
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    elif file_type in ["doc", "docx"]:
        result = mammoth.extract_raw_text(io.BytesIO(file_bytes))
        text = result.value
    elif file_type == "txt":
        text = file_bytes.decode("utf-8")
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
    
    return text

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    # Very basic character-level chunking
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks
