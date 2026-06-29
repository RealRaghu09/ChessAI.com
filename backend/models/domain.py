from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


class RoomStatus(str, Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class GameResult(str, Enum):
    WHITE_WINS = "white_wins"
    BLACK_WINS = "black_wins"
    DRAW = "draw"


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    username: str
    email: str
    password_hash: str
    avatar_url: str | None = None
    elo: int = 1200
    total_matches: int = 0
    wins: int = 0
    losses: int = 0
    draws: int = 0
    win_percentage: float = 0.0
    current_streak: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    last_active_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    is_online: bool = False

    def to_public(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "elo": self.elo,
            "total_matches": self.total_matches,
            "wins": self.wins,
            "losses": self.losses,
            "draws": self.draws,
            "win_percentage": self.win_percentage,
            "current_streak": self.current_streak,
            "created_at": self.created_at.isoformat(),
            "last_active_at": self.last_active_at.isoformat(),
            "is_online": self.is_online,
        }


class Room(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    room_code: str
    host_id: str
    guest_id: str | None = None
    spectator_ids: list[str] = Field(default_factory=list)
    status: RoomStatus = RoomStatus.WAITING
    fen: str = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    pgn: str = ""
    white_time_ms: int = 600_000
    black_time_ms: int = 600_000
    increment_ms: int = 0
    last_move_at: datetime | None = None
    result: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())


class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    room_id: str
    white_user_id: str
    black_user_id: str
    pgn: str = ""
    result: str
    duration_seconds: int = 0
    white_elo_before: int = 1200
    black_elo_before: int = 1200
    white_elo_after: int = 1200
    black_elo_after: int = 1200
    ended_at: datetime = Field(default_factory=lambda: datetime.utcnow())


class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    room_id: str
    sender_id: str
    sender_username: str = ""
    content: str
    sent_at: datetime = Field(default_factory=lambda: datetime.utcnow())


class Reaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    room_id: str
    user_id: str
    username: str = ""
    emoji: str
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())


class EloHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    elo: int
    match_id: str
    recorded_at: datetime = Field(default_factory=lambda: datetime.utcnow())
