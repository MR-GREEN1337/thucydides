"""
PostgreSQL database connection and utilities.

This module provides a singleton instance of PostgresDatabase for database operations.
It handles connection pooling, schema management, and retry logic for database operations.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text
from typing import AsyncGenerator, Dict, Any
from sqlmodel import SQLModel, select
from urllib.parse import urlparse
from loguru import logger
import ssl

from ..core.settings import get_settings
from ..db.models import HistoricalFigure


class PostgresDatabase:
    def __init__(self):
        settings = get_settings()
        self.DATABASE_URL = settings.POSTGRES_DATABASE_URL

        url = urlparse(self.DATABASE_URL)
        base_url = f"postgresql+asyncpg://{url.netloc}{url.path}"

        self.db_host = url.hostname
        self.db_user = url.username
        self.db_name = url.path.lstrip("/") if url.path else None
        self.schema = settings.POSTGRES_SCHEMA

        connect_args = {"statement_cache_size": 0}
        if settings.POSTGRES_USE_SSL:
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connect_args["ssl"] = ssl_context

        logger.info("PostgreSQL statement caching is DISABLED.")

        self.max_retries = settings.POSTGRES_MAX_RETRIES
        self.retry_delay = settings.POSTGRES_RETRY_DELAY

        try:
            self.engine = create_async_engine(
                base_url,
                echo=settings.DEBUG,
                pool_size=settings.POSTGRES_POOL_SIZE,
                max_overflow=settings.POSTGRES_MAX_OVERFLOW,
                pool_timeout=settings.POSTGRES_POOL_TIMEOUT,
                pool_recycle=settings.POSTGRES_POOL_RECYCLE,
                pool_pre_ping=True,
                connect_args=connect_args,
            )
            self.async_session_maker = sessionmaker(
                self.engine, class_=AsyncSession, expire_on_commit=False
            )
            logger.info(
                f"PostgreSQL connection pool initialized for db '{self.db_name}' on host '{self.db_host}'"
            )
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL connection: {e}")
            raise

    async def reset_database_dev_mode(self):
        """
        [DEVELOPMENT ONLY] Drops the schema and all its tables, then recreates them.
        """
        logger.warning(
            f"DEVELOPMENT MODE: Resetting all tables in schema '{self.schema}'..."
        )
        async with self.engine.begin() as conn:
            # Drop schema with cascade to remove all tables within it
            await conn.execute(text(f"DROP SCHEMA IF EXISTS {self.schema} CASCADE"))
            logger.info(f"Schema '{self.schema}' and all its objects dropped.")
            # Recreate the schema
            await conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {self.schema}"))
            logger.info(f"Schema '{self.schema}' created.")
            # Create all tables based on the current models
            await conn.run_sync(SQLModel.metadata.create_all)
            logger.info("All tables created based on current models.")
        logger.warning("DEVELOPMENT MODE: Database reset complete.")

    async def seed_database_dev_mode(self):
        """
        [DEVELOPMENT ONLY] Seeds the database with initial data.
        """
        logger.info("DEVELOPMENT MODE: Seeding database with initial data...")
        async with self.async_session_maker() as session:
            # Check if figures already exist
            result = await session.execute(select(HistoricalFigure))
            if result.scalars().first() is not None:
                logger.info("Database already seeded. Skipping.")
                return

            figures_to_add = [
                HistoricalFigure(
                    name="Marcus Aurelius",
                    title="Roman Emperor & Stoic Philosopher",
                    era="Roman Empire",
                    avatar="https://api.dicebear.com/8.x/adventurer/svg?seed=MarcusAurelius",
                    description="The Stoic Emperor and last of the Five Good Emperors of Rome.",
                    bio="Marcus Aurelius was Roman emperor from 161 to 180 and a Stoic philosopher...",
                    timeline=[
                        {"year": "121 AD", "event": "Born in Rome"},
                        {"year": "161 AD", "event": "Becomes Emperor of Rome"},
                    ],
                    sources=["Meditations by Marcus Aurelius"],
                    media=[
                        {
                            "type": "image",
                            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Metropolitan_Marcus_Aurelius_1.jpg/800px-Metropolitan_Marcus_Aurelius_1.jpg",
                            "caption": "Equestrian Statue",
                        }
                    ],
                ),
                HistoricalFigure(
                    name="Socrates",
                    title="Athenian Philosopher",
                    era="Ancient Greece",
                    avatar="https://api.dicebear.com/8.x/adventurer/svg?seed=Socrates",
                    description="A founder of Western philosophy, known for his method of questioning.",
                    bio="Socrates was a Greek philosopher from Athens who is credited as the founder of Western philosophy...",
                    timeline=[
                        {"year": "470 BC", "event": "Born in Athens, Greece"},
                        {"year": "399 BC", "event": "Trial and execution in Athens"},
                    ],
                    sources=["Plato's 'Apology'"],
                    media=[],
                ),
                HistoricalFigure(
                    name="Cleopatra",
                    title="Last Pharaoh of Egypt",
                    era="Ptolemaic Egypt",
                    avatar="https://api.dicebear.com/8.x/adventurer/svg?seed=Cleopatra",
                    description="The last active ruler of the Ptolemaic Kingdom of Egypt.",
                    bio="Cleopatra VII Philopator was Queen of the Ptolemaic Kingdom of Egypt from 51 to 30 BC...",
                    timeline=[
                        {"year": "69 BC", "event": "Born in Alexandria"},
                        {"year": "30 BC", "event": "Dies in Alexandria"},
                    ],
                    sources=["Plutarch's 'Life of Antony'"],
                    media=[],
                ),
            ]
            session.add_all(figures_to_add)
            await session.commit()
            logger.info(
                f"Successfully seeded {len(figures_to_add)} historical figures."
            )

    async def health_check(self) -> Dict[str, Any]:
        try:
            async with self.async_session_maker() as session:
                await session.execute(text("SELECT 1"))
            return {"status": "ok", "message": "Database connection is healthy."}
        except Exception as e:
            return {"status": "error", "message": f"Database connection failed: {e}"}


# --- SINGLETON INSTANCE ---
postgres_db = PostgresDatabase()


# --- CORRECTED FASTAPI DEPENDENCY ---
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to get a database session.
    This is the correct pattern for yielding a session and ensuring it's closed.
    """
    async with postgres_db.async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
