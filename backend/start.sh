#!/usr/bin/env bash

# Exit on error
set -e

cd backend

if [ "$1" = "build" ]; then
    echo "Starting build process..."
    
    # Render doesn't have GPUs, so we force CPU version of PyTorch to save massive amounts of space
    # and prevent build timeouts/OOM errors.
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
    
    # Install the rest of the dependencies
    pip install -r requirements.txt
    
elif [ "$1" = "start" ]; then
    echo "Starting FastAPI server..."
    # Render uses the $PORT environment variable
    uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
else
    echo "Usage: ./backend/start.sh [build|start]"
    exit 1
fi
