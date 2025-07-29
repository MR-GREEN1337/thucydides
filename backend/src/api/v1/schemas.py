"""Pydantic schemas for API request/response validation."""

from typing import List, Any
from sqlmodel import SQLModel
import uuid
from datetime import datetime

# --- Figure Schemas ---


class HistoricalFigureRead(SQLModel):
    id: uuid.UUID
    name: str
    title: str
    era: str
    avatar: str
    description: str


class HistoricalFigureDetail(HistoricalFigureRead):
    bio: str
    timeline: List[dict]
    sources: List[str]
    media: List[dict]


class SearchRequest(SQLModel):
    query: str


# --- Dialogue Schemas ---


class DialogueSessionRead(SQLModel):
    id: uuid.UUID
    created_at: datetime
    historical_figure_id: uuid.UUID


class MessageRead(SQLModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime
    citations: List[Any]  # Simplified for now


class DialogueSessionDetail(DialogueSessionRead):
    messages: List[MessageRead]


class DialogueStartRequest(SQLModel):
    figure_id: uuid.UUID


class ChatRequest(SQLModel):
    content: str
    use_web_search: bool = False  # ADDED: Flag for enabling web search


class RecentDialogueRead(SQLModel):
    """Schema for the 'Active Dialogues' cards on the dashboard."""

    figure_id: uuid.UUID
    figure_name: str
    figure_avatar: str
    last_active: datetime
    session_id: uuid.UUID
