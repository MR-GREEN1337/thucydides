"""
FastAPI application lifecycle management.

This module provides a lifespan context manager for FastAPI application.
It handles startup and shutdown events with robust error handling.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from loguru import logger
import time
import sys

from ..db.postgresql import postgres_db
from ..db.qdrant import qdrant_db  # <--- IMPORT QDRANT DB
from ..core.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    Handles startup and shutdown events with robust error handling.
    """
    settings = get_settings()
    start_time = time.time()

    # --- Logger Configuration ---
    logger.remove()
    logger.add(
        sys.stderr,
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        level="INFO",
    )

    # --- Application Startup ---
    logger.info(f"Starting application in '{settings.ENV}' mode")
    logger.info(f"API Version: {app.version}")

    try:
        # --- Database Initialization ---
        logger.info("Initializing database connection...")

        # In development, wipe, recreate, and seed the database on every startup.
        if settings.ENV == "development":
            await postgres_db.reset_database_dev_mode()
            await postgres_db.seed_database_dev_mode()
            # NEW: Index data in Qdrant after seeding Postgres
            await qdrant_db.index_all_figures_dev_mode()

        # Health check to ensure the connection is valid post-reset or on normal start.
        db_health = await postgres_db.health_check()
        if db_health["status"] != "ok":
            raise Exception(
                f"Database connection health check failed: {db_health.get('message')}"
            )

        app.state.db = postgres_db
        app.state.db_available = True
        startup_duration = time.time() - start_time
        logger.info(
            f"Database connection established successfully in {startup_duration:.2f} seconds"
        )

    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        app.state.db_available = False

        if settings.FAIL_FAST:
            logger.critical(
                "Application startup failed due to database connection error. Exiting."
            )
            # Re-raise the exception to stop the application from starting
            raise
        else:
            logger.warning(
                "FAIL_FAST is False. Application continuing without database connection. "
                "Database-dependent endpoints will fail."
            )

    logger.info(
        f"Application startup complete in {time.time() - start_time:.2f} seconds"
    )
    yield

    # --- Application Shutdown ---
    shutdown_start = time.time()
    logger.info("Shutting down application...")
    # Add any cleanup logic here (e.g., closing a Redis connection)
    logger.info(
        f"Application shutdown complete in {time.time() - shutdown_start:.2f} seconds"
    )
