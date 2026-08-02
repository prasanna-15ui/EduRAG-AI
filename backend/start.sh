#!/usr/bin/env bash

# Exit on error
set -e

# This script is kept for local use or alternate hosting. 
# Render uses render.yaml directly.

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
