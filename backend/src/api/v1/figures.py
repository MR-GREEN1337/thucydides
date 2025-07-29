"""API endpoints for managing and retrieving historical figures."""

import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from fastapi.responses import StreamingResponse
from loguru import logger
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ...db.models import HistoricalFigure, User
from ...db.postgresql import get_session
from ...utils.security import get_current_user
from .schemas import HistoricalFigureRead, HistoricalFigureDetail
from ...services.gemini import gemini_service

router = APIRouter()


@router.post(
    "/search", summary="Use AI to find a figure via a streaming thought process"
)
async def search_for_figure_streaming(
    query: str = Form(...),
    file: Optional[UploadFile] = File(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Accepts a natural language query and uses a streaming LLM call to find
    the best matching historical figure, yielding its thought process as JSON events.
    Handles both text queries and optional file uploads for context.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter cannot be empty.")

    # MODIFIED: Implement file content reading
    file_context = None
    if file:
        try:
            contents = await file.read()
            file_context = contents.decode("utf-8", errors="replace")
            logger.info(
                f"Successfully read and decoded file '{file.filename}' for context."
            )
        except Exception as e:
            logger.error(
                f"Failed to read or decode uploaded file '{file.filename}': {e}"
            )
            # Continue without file context if it fails
            file_context = None

    result = await session.execute(select(HistoricalFigure))
    all_figures = result.scalars().all()

    async def stream_generator():
        # SSE format requires "data: " prefix and "\n\n" suffix
        # MODIFIED: Pass file_context to the service
        async for event in gemini_service.stream_figure_search(
            query, all_figures, file_context=file_context
        ):
            yield f"data: {json.dumps(event)}\n\n"
        # Signal the end of the stream to the client
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


# ... (the rest of the file is unchanged)
@router.get("/featured", response_model=List[HistoricalFigureRead])
async def get_featured_figures(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    statement = select(HistoricalFigure).limit(3)
    result = await session.execute(statement)
    return result.scalars().all()


@router.get("/archive", response_model=List[HistoricalFigureRead])
async def get_all_figures_for_archive(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(HistoricalFigure).order_by(HistoricalFigure.name)
    )
    return result.scalars().all()


@router.get("/{figure_id}", response_model=HistoricalFigureDetail)
async def get_figure_details(
    figure_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    figure = await session.get(HistoricalFigure, figure_id)
    if not figure:
        raise HTTPException(status_code=404, detail="Historical figure not found.")
    return figure
