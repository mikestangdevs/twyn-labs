from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import api_router
from src.api.routes import assets
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Twyn SSE API",
    description="Server-Sent Events Backend API for Twyn with Vision & Multimodal Support",
    version="1.1.0"
)

# Configure CORS - Allow all localhost origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include all routes through the centralized router
app.include_router(api_router)

# Include assets routes (vision & multimodality)
app.include_router(assets.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
