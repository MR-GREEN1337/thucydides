import asyncio
from logging.config import fileConfig
from urllib.parse import urlparse
import ssl

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

from alembic import context

# --- CUSTOM IMPORTS FOR YOUR PROJECT ---
# Add the project's src directory to the Python path
import sys
from pathlib import Path

# Go up two levels from env.py (alembic/ -> backend/) and add 'src'
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

# Now, import the models and the base metadata object
# This ensures that all models attached to SQLModel.metadata are loaded
from db.models import SCHEMA

# ----------------------------------------

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the target metadata for autogeneration
# This is now guaranteed to have the models registered.
target_metadata = SQLModel.metadata
target_metadata.schema = SCHEMA

# Set the database URL from your application's settings
# This ensures Alembic uses the same database as your app
from core.settings import get_settings  # noqa: E402

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.POSTGRES_DATABASE_URL)


def include_object(object, name, type_, reflected, compare_to):
    """
    Exclude tables from other schemas.
    """
    if type_ == "table" and object.schema != target_metadata.schema:
        return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema=target_metadata.schema,
        include_schemas=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table_schema=target_metadata.schema,
        include_schemas=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    db_url = config.get_main_option("sqlalchemy.url")
    parsed_url = urlparse(db_url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"

    connect_args = {}
    if settings.POSTGRES_USE_SSL:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ssl_context

    connectable = create_async_engine(
        base_url,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
