import logging
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from config import get_settings
from models.domain import ChatMessage, EloHistory, Match, Reaction, Room, RoomStatus, User
from storage.json_store import JsonCollectionStore, StorageProvider

logger = logging.getLogger(__name__)
Base = declarative_base()


class UserORM(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    elo = Column(Integer, default=1200)
    total_matches = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    win_percentage = Column(Float, default=0.0)
    current_streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.utcnow)
    is_online = Column(Boolean, default=False)


class RoomORM(Base):
    __tablename__ = "rooms"
    id = Column(String, primary_key=True)
    room_code = Column(String, unique=True, nullable=False)
    host_id = Column(String, nullable=False)
    guest_id = Column(String, nullable=True)
    spectator_ids = Column(Text, default="[]")
    status = Column(String, default=RoomStatus.WAITING.value)
    fen = Column(Text, nullable=False)
    pgn = Column(Text, default="")
    white_time_ms = Column(Integer, default=600_000)
    black_time_ms = Column(Integer, default=600_000)
    increment_ms = Column(Integer, default=0)
    last_move_at = Column(DateTime, nullable=True)
    result = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MatchORM(Base):
    __tablename__ = "matches"
    id = Column(String, primary_key=True)
    room_id = Column(String, nullable=False)
    white_user_id = Column(String, nullable=False)
    black_user_id = Column(String, nullable=False)
    pgn = Column(Text, default="")
    result = Column(String, nullable=False)
    duration_seconds = Column(Integer, default=0)
    white_elo_before = Column(Integer, default=1200)
    black_elo_before = Column(Integer, default=1200)
    white_elo_after = Column(Integer, default=1200)
    black_elo_after = Column(Integer, default=1200)
    ended_at = Column(DateTime, default=datetime.utcnow)


class ChatMessageORM(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True)
    room_id = Column(String, nullable=False)
    sender_id = Column(String, nullable=False)
    sender_username = Column(String, default="")
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)


class ReactionORM(Base):
    __tablename__ = "reactions"
    id = Column(String, primary_key=True)
    room_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    username = Column(String, default="")
    emoji = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class EloHistoryORM(Base):
    __tablename__ = "elo_history"
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    elo = Column(Integer, nullable=False)
    match_id = Column(String, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class PostgresStorage(StorageProvider):
    backend_name = "postgresql"

    def __init__(self, database_url: str):
        self.engine = create_engine(database_url, pool_pre_ping=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False)

    def health_check(self) -> bool:
        try:
            with self.engine.connect() as conn:
                conn.execute(__import__("sqlalchemy").text("SELECT 1"))
            return True
        except Exception as exc:
            logger.warning("PostgreSQL health check failed: %s", exc)
            return False

    def get_session(self) -> Session:
        return self.SessionLocal()


class JsonStorage(StorageProvider):
    backend_name = "json"

    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.users = JsonCollectionStore(data_dir / "users.json", User)
        self.rooms = JsonCollectionStore(data_dir / "rooms.json", Room)
        self.matches = JsonCollectionStore(data_dir / "matches.json", Match)
        self.chat_messages = JsonCollectionStore(data_dir / "chat.json", ChatMessage)
        self.reactions = JsonCollectionStore(data_dir / "reactions.json", Reaction)
        self.elo_history = JsonCollectionStore(data_dir / "elo_history.json", EloHistory)

    def health_check(self) -> bool:
        return True
