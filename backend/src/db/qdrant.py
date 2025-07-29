"""
Qdrant vector database connection and utilities.

This module provides a singleton instance of QdrantDatabase for vector search operations.
It handles client initialization, collection management, and document indexing/searching.
"""

import uuid
from typing import List

from qdrant_client import AsyncQdrantClient, models
from qdrant_client.http.models import PointStruct
from loguru import logger
import google.generativeai as genai
from sqlmodel import select

from ..core.settings import get_settings
from ..db.models import HistoricalFigure
from .postgresql import postgres_db


class QdrantDatabase:
    """Singleton for managing Qdrant vector database operations."""

    # Google's text-embedding-004 model produces 768-dimensional vectors.
    VECTOR_SIZE = 768
    DISTANCE_METRIC = models.Distance.COSINE

    def __init__(self):
        settings = get_settings()
        logger.info("Initializing Async Qdrant client...")
        self.client = AsyncQdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            timeout=60,  # Increase timeout for potentially long operations
        )
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.embedding_model = settings.EMBEDDING_MODEL_NAME
        logger.info(
            f"Async Qdrant client initialized for collection '{self.collection_name}'."
        )

    async def recreate_collection(self):
        """Deletes and recreates the collection, ensuring a clean state."""
        logger.warning(f"Recreating Qdrant collection '{self.collection_name}'...")
        await self.client.recreate_collection(
            collection_name=self.collection_name,
            vectors_config=models.VectorParams(
                size=self.VECTOR_SIZE, distance=self.DISTANCE_METRIC
            ),
        )
        logger.info(f"Collection '{self.collection_name}' recreated successfully.")

    def _chunk_text(
        self, text: str, chunk_size: int = 512, chunk_overlap: int = 64
    ) -> List[str]:
        """Simple text chunker based on sentences."""
        # A more sophisticated splitter (e.g., from LangChain) could be used here.
        # This is a basic implementation for demonstration.
        if not text:
            return []
        from textwrap import wrap

        chunks = wrap(
            text, width=chunk_size, break_long_words=False, replace_whitespace=False
        )
        return chunks

    async def index_all_figures_dev_mode(self):
        """
        [DEVELOPMENT ONLY] Indexes all historical figures' 'bio' field from Postgres into Qdrant.
        This adds biographical context to the RAG system.
        NOTE: Primary source indexing is now handled by the separate `ingest_gutenberg.py` script.
        """
        logger.info("Starting RAG indexing for all historical figures' biographies...")
        # We don't recreate the collection here to preserve the Gutenberg data.
        # await self.recreate_collection()

        points_to_upsert = []

        async with postgres_db.async_session_maker() as session:
            result = await session.execute(select(HistoricalFigure))
            figures = result.scalars().all()

        for figure in figures:
            bio_chunks = self._chunk_text(figure.bio)
            for i, chunk in enumerate(bio_chunks):
                doc_id = str(uuid.uuid4())
                payload = {
                    "figure_name": figure.name,
                    "source_name": "Biography",
                    "text": chunk,
                }
                points_to_upsert.append(
                    PointStruct(
                        id=doc_id, payload=payload, vector=[0.0] * self.VECTOR_SIZE
                    )
                )  # temp vector

        if not points_to_upsert:
            logger.info("No biographies found to index.")
            return

        logger.info(
            f"Generated {len(points_to_upsert)} biography chunks to be embedded and indexed."
        )

        batch_size = 50
        for i in range(0, len(points_to_upsert), batch_size):
            batch = points_to_upsert[i : i + batch_size]
            texts_to_embed = [point.payload["text"] for point in batch]

            logger.info(f"Embedding biography batch {i//batch_size + 1}...")
            embedding_result = await genai.embed_content_async(
                model=self.embedding_model,
                content=texts_to_embed,
                task_type="RETRIEVAL_DOCUMENT",
            )

            for point, embedding in zip(batch, embedding_result["embedding"]):
                point.vector = embedding

            await self.client.upsert(
                collection_name=self.collection_name, points=batch, wait=True
            )
            logger.info(f"Upserted biography batch {i//batch_size + 1} into Qdrant.")

        logger.info(
            f"Successfully indexed biographies for {len(figures)} historical figures."
        )

    async def search(
        self, query: str, figure_name: str, limit: int = 5
    ) -> List[models.ScoredPoint]:
        """Searches for relevant documents for a given query and figure name."""
        logger.info(
            f"Performing RAG search for figure '{figure_name}' with query: '{query[:50]}...'"
        )

        query_embedding_result = await genai.embed_content_async(
            model=self.embedding_model, content=[query], task_type="RETRIEVAL_QUERY"
        )
        query_vector = query_embedding_result["embedding"][0]

        search_results = await self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=models.Filter(
                must=[
                    # IMPORTANT: We now filter by 'figure_name', which is a string.
                    models.FieldCondition(
                        key="figure_name",
                        match=models.MatchValue(value=figure_name),
                    )
                ]
            ),
            limit=limit,
            with_payload=True,
        )
        logger.info(f"Found {len(search_results)} relevant documents from Qdrant.")
        return search_results


# --- SINGLETON INSTANCE ---
qdrant_db = QdrantDatabase()
