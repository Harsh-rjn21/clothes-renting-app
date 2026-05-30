import os
import sys

# Load root .env file variables dynamically
def load_env():
    root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    if os.path.exists(root_env):
        with open(root_env) as f:
            for line in f:
                if line.strip() and not line.strip().startswith('#') and '=' in line:
                    key, val = line.strip().split('=', 1)
                    os.environ[key.strip()] = val.strip()

load_env()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import database
import models
from routers import auth, catalog, rental, feedback

# Auto-create SQLite database tables on startup
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Clothes Renting API Gateway",
    description="Unified monolith API service containing Auth, Catalog, Rental, and Feedback modules.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(catalog.router, prefix="/catalog", tags=["Catalog"])
app.include_router(rental.router, prefix="/rental", tags=["Rental"])
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])

# Mount static upload folder under /catalog/static to match old catalog service routing
app.mount("/catalog/static", StaticFiles(directory=catalog.UPLOAD_DIR), name="static")

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "unified_backend"}
