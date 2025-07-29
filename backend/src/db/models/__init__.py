from typing import List, Optional
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column
from sqlmodel import Field, Relationship, SQLModel, text
import uuid
from datetime import datetime

SCHEMA = "public"


class HistoricalFigure(SQLModel, table=True):
    __table_args__ = {"schema": SCHEMA}
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    title: str
    era: str
    avatar: str  # URL to an image
    description: str  # Short description for cards

    # Detailed fields for the "Study" panel
    bio: str = Field(sa_column=text("bio"))
    timeline: List[dict] = Field(default=[], sa_column=Column(JSONB))
    sources: List[str] = Field(default=[], sa_column=Column(JSONB))
    media: List[dict] = Field(default=[], sa_column=Column(JSONB))

    dialogue_sessions: List["DialogueSession"] = Relationship(
        back_populates="historical_figure"
    )


class User(SQLModel, table=True):
    __table_args__ = {"schema": "public"}
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: Optional[str] = None
    hashed_password: Optional[str] = None  # Can be null for social-only logins
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    active_project_id: Optional[uuid.UUID] = Field(default=None, nullable=True)

    # Stripe-related fields
    stripe_customer_id: Optional[str] = Field(default=None, index=True, unique=True)
    stripe_subscription_id: Optional[str] = Field(default=None, unique=True)
    stripe_subscription_status: Optional[str] = Field(
        default="hobby"
    )  # e.g., hobby, active, canceled, past_due

    projects: List["Project"] = Relationship(back_populates="user")


class Project(SQLModel, table=True):
    __table_args__ = {"schema": SCHEMA}
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: uuid.UUID = Field(foreign_key=f"{SCHEMA}.user.id")
    user: User = Relationship(back_populates="projects")
    dialogue_sessions: List["DialogueSession"] = Relationship(back_populates="project")


class DialogueSession(SQLModel, table=True):
    __table_args__ = {"schema": SCHEMA}
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project_id: uuid.UUID = Field(foreign_key=f"{SCHEMA}.project.id")
    project: Project = Relationship(back_populates="dialogue_sessions")

    # Replaced the simple string with a foreign key
    historical_figure_id: uuid.UUID = Field(foreign_key=f"{SCHEMA}.historicalfigure.id")
    historical_figure: HistoricalFigure = Relationship(
        back_populates="dialogue_sessions"
    )

    messages: List["Message"] = Relationship(back_populates="dialogue_session")


class Message(SQLModel, table=True):
    __table_args__ = {"schema": SCHEMA}
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    role: str
    content: str = Field(sa_column=text("content"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    dialogue_session_id: uuid.UUID = Field(foreign_key=f"{SCHEMA}.dialoguesession.id")
    dialogue_session: "DialogueSession" = Relationship(back_populates="messages")
    citations: List["Citation"] = Relationship(back_populates="message")


class Citation(SQLModel, table=True):
    __table_args__ = {"schema": SCHEMA}
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    source: str
    text_quote: str = Field(sa_column=text("text_quote"))
    message_id: uuid.UUID = Field(foreign_key=f"{SCHEMA}.message.id")
    message: Message = Relationship(back_populates="citations")
