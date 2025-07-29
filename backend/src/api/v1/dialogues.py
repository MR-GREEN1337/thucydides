"""API endpoints for managing dialogue sessions and messages."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from loguru import logger
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload
import sqlalchemy as sa

from ...db.models import (
    DialogueSession,
    HistoricalFigure,
    Message,
    User,
    Project,
    Citation,
)

# FIX: Import the singleton postgres_db instance to access the session maker
from ...db.postgresql import get_session, postgres_db
from ...utils.security import get_current_user
from .schemas import (
    ChatRequest,
    DialogueSessionRead,
    MessageRead,
    RecentDialogueRead,
    DialogueStartRequest,
)
from ...services.gemini import gemini_service

router = APIRouter()


def _construct_system_prompt(figure: HistoricalFigure) -> str:
    # This prompt is now the base persona, RAG context will be added on the fly
    return f"""
    You are an AI expert embodying the historical figure: {figure.name} ({figure.title}).
    Your persona, speaking style, and knowledge MUST be based on this person's historical context.
    RULES:
    1. Persona: Always speak in the first person ("I", "my", "me") from the perspective of {figure.name}.
    2. Style: Adopt a tone and vocabulary appropriate to the figure's era and personality.
    3. Knowledge Source: You will be provided with source material. Confine your knowledge STRICTLY to what is in that material.
    4. Introduction: If asked to introduce yourself, provide a brief, in-character summary of who you are based on the sources.
    """


@router.post(
    "/start",
    response_model=DialogueSessionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new dialogue session",
)
async def start_dialogue_session(
    request: DialogueStartRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not current_user.active_project_id:
        raise HTTPException(
            status_code=400, detail="User does not have an active project."
        )

    figure = await session.get(HistoricalFigure, request.figure_id)
    if not figure:
        raise HTTPException(status_code=404, detail="Historical figure not found")

    new_session = DialogueSession(
        project_id=current_user.active_project_id,
        historical_figure_id=request.figure_id,
    )
    session.add(new_session)
    await session.commit()  # Commit to get the ID
    await session.refresh(new_session)

    # Generate a welcome message using the RAG flow with a generic query
    welcome_query = f"Please introduce yourself, {figure.name}."
    welcome_stream = gemini_service.stream_rag_response(
        system_prompt=_construct_system_prompt(figure),
        user_query=welcome_query,
        figure_name=figure.name,  # <-- Pass name instead of ID
        chat_history=[],
    )

    welcome_content = ""
    welcome_citations = []
    async for event in welcome_stream:
        if event["type"] == "text":
            welcome_content += event["content"]
        elif event["type"] == "citations":
            welcome_citations = event["data"]

    welcome_message = Message(
        role="assistant", content=welcome_content, dialogue_session_id=new_session.id
    )
    session.add(welcome_message)
    await session.flush()  # Flush to get the message ID

    # Add citations for the welcome message
    for cit in welcome_citations:
        cit.message_id = welcome_message.id
        session.add(cit)

    await session.commit()
    await session.refresh(new_session)

    logger.info(
        f"User '{current_user.email}' started new session '{new_session.id}' with '{figure.name}'."
    )
    return new_session


@router.post(
    "/{dialogue_id}/chat",
    summary="Post a new message and get a streaming RAG response",
)
async def post_chat_message_streaming(
    dialogue_id: uuid.UUID,
    chat_request: ChatRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(DialogueSession)
        .join(Project)
        .where(Project.user_id == current_user.id, DialogueSession.id == dialogue_id)
        .options(
            selectinload(DialogueSession.historical_figure),
            selectinload(DialogueSession.messages),  # No need to load citations here
        )
    )
    result = await session.execute(statement)
    dialogue_session = result.scalars().first()

    if not dialogue_session:
        raise HTTPException(status_code=404, detail="Dialogue session not found.")

    # Save user message first
    user_message = Message(
        role="user",
        content=chat_request.content,
        dialogue_session_id=dialogue_id,
    )
    session.add(user_message)
    await session.commit()
    logger.info(
        f"User '{current_user.email}' posted to session '{dialogue_id}'. Awaiting RAG stream."
    )

    async def stream_generator():
        system_prompt = _construct_system_prompt(dialogue_session.historical_figure)

        full_chat_history = dialogue_session.messages + [user_message]

        stream = gemini_service.stream_rag_response(
            system_prompt,
            chat_request.content,
            dialogue_session.historical_figure.name,  # <-- Pass name instead of ID
            full_chat_history,
            use_web_search=chat_request.use_web_search,  # MODIFIED: Pass the flag
        )

        final_response_text = ""
        final_citations = []
        async for event in stream:
            if event["type"] == "text":
                yield event["content"]
                final_response_text += event["content"]
            elif event["type"] == "citations":
                final_citations = event["data"]

        # After streaming is complete, save the assistant message and citations
        async with postgres_db.async_session_maker() as post_stream_session:
            assistant_message = Message(
                role="assistant",
                content=final_response_text,
                dialogue_session_id=dialogue_id,
            )
            post_stream_session.add(assistant_message)
            await post_stream_session.flush()  # Flush to get message ID

            for cit_data in final_citations:
                new_citation = Citation(
                    source=cit_data.source,
                    text_quote=cit_data.text_quote,
                    message_id=assistant_message.id,
                )
                post_stream_session.add(new_citation)

            await post_stream_session.commit()
            logger.info(
                f"RAG stream for session '{dialogue_id}' complete. Assistant message and {len(final_citations)} citations saved."
            )

    return StreamingResponse(stream_generator(), media_type="text/plain")


@router.get("/recent", response_model=List[RecentDialogueRead])
async def get_recent_dialogues(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    subquery = (
        select(
            DialogueSession.historical_figure_id,
            sa.func.max(DialogueSession.created_at).label("max_created_at"),
        )
        .join(Project)
        .where(Project.user_id == current_user.id)
        .group_by(DialogueSession.historical_figure_id)
        .subquery()
    )
    statement = (
        select(DialogueSession)
        .join(
            subquery,
            sa.and_(
                DialogueSession.historical_figure_id == subquery.c.historical_figure_id,
                DialogueSession.created_at == subquery.c.max_created_at,
            ),
        )
        .join(Project)
        .where(Project.user_id == current_user.id)
        .options(selectinload(DialogueSession.historical_figure))
        .order_by(DialogueSession.created_at.desc())
        .limit(5)
    )
    result = await session.execute(statement)
    sessions = result.scalars().all()
    response = [
        RecentDialogueRead(
            figure_id=s.historical_figure.id,
            figure_name=s.historical_figure.name,
            figure_avatar=s.historical_figure.avatar,
            last_active=s.created_at,
            session_id=s.id,
        )
        for s in sessions
    ]
    return response


@router.get("/", response_model=List[DialogueSessionRead])
async def get_dialogue_sessions_for_figure(
    figure_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(DialogueSession)
        .join(Project)
        .where(Project.user_id == current_user.id)
        .where(DialogueSession.historical_figure_id == figure_id)
        .order_by(DialogueSession.created_at.desc())
    )
    result = await session.execute(statement)
    sessions = result.scalars().all()
    return sessions


@router.get("/{dialogue_id}/messages", response_model=List[MessageRead])
async def get_messages_for_session(
    dialogue_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(DialogueSession)
        .join(Project)
        .where(Project.user_id == current_user.id, DialogueSession.id == dialogue_id)
        .options(selectinload(DialogueSession.messages).selectinload(Message.citations))
    )

    result = await session.execute(statement)
    dialogue_session: DialogueSession = result.scalars().first()
    if not dialogue_session:
        raise HTTPException(status_code=404, detail="Dialogue session not found.")
    return dialogue_session.messages
