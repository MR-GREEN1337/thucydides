import os
import re
import uuid
import asyncio
from typing import List, TypedDict

import aiohttp
from dotenv import load_dotenv
import google.generativeai as genai
from qdrant_client import AsyncQdrantClient, models
from qdrant_client.http.models import PointStruct
from tqdm.asyncio import tqdm as an_tqdm

# --- CONFIGURATION ---
load_dotenv()

QDRANT_URL = "http://localhost:6333"
QDRANT_COLLECTION_NAME = "thucydides_sources"
EMBEDDING_MODEL = "models/text-embedding-004"
VECTOR_SIZE = 768
BATCH_SIZE = 32  # Number of chunks to embed and upsert at a time


class BookConfig(TypedDict):
    """Defines the structure for a book to be indexed."""

    figure_name: str
    gutenberg_id: int
    source_title: str


# Define the library of books to be indexed here.
# This is now the source of truth for the RAG content.
BOOKS_TO_INDEX: List[BookConfig] = [
    {
        "figure_name": "Marcus Aurelius",
        "gutenberg_id": 2680,
        "source_title": "Meditations",
    },
    {
        "figure_name": "Socrates",  # Plato's Apology is from Socrates' perspective
        "gutenberg_id": 1657,
        "source_title": "The Apology of Socrates by Plato",
    },
    {
        "figure_name": "Cleopatra",  # We'll use Plutarch's Life of Antony for her
        "gutenberg_id": 14210,
        "source_title": "Plutarch's Life of Antony",
    },
    # Add more figures and their primary texts here
    # {
    #     "figure_name": "Sun Tzu",
    #     "gutenberg_id": 132,
    #     "source_title": "The Art of War"
    # },
]

# --- SCRIPT LOGIC ---

client = AsyncQdrantClient(url=QDRANT_URL)


async def download_gutenberg_text(session: aiohttp.ClientSession, book_id: int) -> str:
    """Downloads the plain text version of a book from Project Gutenberg."""
    url = f"https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}.txt"
    async with session.get(url) as response:
        response.raise_for_status()
        return await response.text(encoding="utf-8", errors="ignore")


def clean_text(text: str) -> str:
    """Removes Project Gutenberg headers/footers. A best-effort cleaning."""
    start_pattern = r"\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK.*\*\*\*"
    end_pattern = r"\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK.*\*\*\*"

    try:
        start_match = re.search(start_pattern, text, re.IGNORECASE)
        end_match = re.search(end_pattern, text, re.IGNORECASE)

        start_index = start_match.end() if start_match else 0
        end_index = end_match.start() if end_match else len(text)

        content = text[start_index:end_index].strip()

        # Consolidate whitespace
        content = re.sub(r"\s+", " ", content)
        # Remove chapter headings and other artifacts if needed (optional)
        content = re.sub(r"CHAPTER [IVXLCDM]+\.", "", content, flags=re.IGNORECASE)
        return content
    except Exception as e:
        print(f"Could not clean text, returning original. Error: {e}")
        return text


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> List[str]:
    """Splits text into overlapping chunks."""
    # This is a basic chunker. For more advanced needs, consider
    # libraries like langchain.text_splitter.RecursiveCharacterTextSplitter
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


async def process_and_index_books(force_recreate: bool = False):
    """Main function to download, process, and index all configured books."""
    print("--- Starting Project Gutenberg Ingestion ---")

    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise ValueError("GOOGLE_API_KEY not found in .env file.")
    genai.configure(api_key=google_api_key)

    if force_recreate:
        print(f"Force recreating collection '{QDRANT_COLLECTION_NAME}'...")
        await client.recreate_collection(
            collection_name=QDRANT_COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=VECTOR_SIZE, distance=models.Distance.COSINE
            ),
        )

    async with aiohttp.ClientSession() as session:
        for book in BOOKS_TO_INDEX:
            print(
                f"\nProcessing '{book['source_title']}' for {book['figure_name']} (Book ID: {book['gutenberg_id']})"
            )

            raw_text = await download_gutenberg_text(session, book["gutenberg_id"])
            cleaned_text = clean_text(raw_text)
            text_chunks = chunk_text(cleaned_text)

            if not text_chunks:
                print(
                    f"Warning: No text chunks generated for book {book['gutenberg_id']}."
                )
                continue

            print(f"Split into {len(text_chunks)} chunks. Indexing in batches...")

            points_to_upsert = []
            for chunk in text_chunks:
                # The payload now contains the figure's name directly
                payload = {
                    "figure_name": book["figure_name"],
                    "source_name": book["source_title"],
                    "text": chunk,
                }
                points_to_upsert.append(
                    PointStruct(id=str(uuid.uuid4()), payload=payload, vector=[])
                )

            progress_bar = an_tqdm(
                total=len(points_to_upsert), desc=f"Indexing '{book['source_title']}'"
            )
            for i in range(0, len(points_to_upsert), BATCH_SIZE):
                batch_points = points_to_upsert[i : i + BATCH_SIZE]
                texts_to_embed = [p.payload["text"] for p in batch_points]

                embedding_result = await genai.embed_content_async(
                    model=EMBEDDING_MODEL,
                    content=texts_to_embed,
                    task_type="RETRIEVAL_DOCUMENT",
                )

                for point, embedding in zip(
                    batch_points, embedding_result["embedding"]
                ):
                    point.vector = embedding

                await client.upsert(
                    collection_name=QDRANT_COLLECTION_NAME,
                    points=batch_points,
                    wait=True,
                )
                progress_bar.update(len(batch_points))

            progress_bar.close()

    print("\n--- Ingestion Complete ---")


if __name__ == "__main__":
    # To run, execute `python ingest_gutenberg.py` from the `scripts` directory.
    # Set force_recreate=True to wipe the collection and start fresh.
    asyncio.run(process_and_index_books(force_recreate=True))
