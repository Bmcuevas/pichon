"""Punto de entrada para levantar la API."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'vendor'))

import uvicorn

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
