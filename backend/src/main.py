from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.utils import lifespan
from src.db.postgresql import postgres_db
from src.api import router as api_router
from src.core.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="Thucydides API",
    description="The RAG & Dialogue Engine for conversing with history.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Thucydides RAG & Dialogue Engine is running."}


@app.get("/health")
async def health_check():
    """Provides a health check for the API and its database connection."""
    db_health = await postgres_db.health_check()
    return {"api_status": "ok", "database": db_health}
