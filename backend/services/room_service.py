from datetime import datetime, timezone

import chess

from config import get_settings
from models.domain import GameResult, Room, RoomStatus
from repositories.base import get_room_repository, get_user_repository
from utils.room_code import generate_room_code


class RoomService:
    def __init__(self):
        self.room_repo = get_room_repository()
        self.user_repo = get_user_repository()
        self.settings = get_settings()

    def _unique_code(self) -> str:
        '''
        Generate a unique room code
        '''
        for _ in range(20):
            code = generate_room_code()
            if not self.room_repo.get_room_by_code(code):
                return code
        raise RuntimeError("Could not generate unique room code")

    def create_room(self, host_id: str, time_control: dict | None = None) -> Room:
        '''
        Create a new room
        '''
        tc = time_control or {}
        initial_ms = tc.get("initial_ms", self.settings.default_time_ms)
        increment_ms = tc.get("increment_ms", self.settings.default_increment_ms)
        room = Room(
            room_code=self._unique_code(),
            host_id=host_id,
            white_time_ms=initial_ms,
            black_time_ms=initial_ms,
            increment_ms=increment_ms,
        )
        return self.room_repo.create_room(room)

    def join_room(self, room_code: str, guest_id: str) -> Room:
        '''
        Join a room
        '''
        room = self.room_repo.get_room_by_code(room_code)
        if not room:
            raise ValueError("Room not found")
        if room.status != RoomStatus.WAITING:
            raise ValueError("Room is not accepting players")
        if room.host_id == guest_id:
            raise ValueError("Cannot join your own room")
        if room.guest_id and room.guest_id != guest_id:
            raise ValueError("Room is full")

        room.guest_id = guest_id
        room.status = RoomStatus.IN_PROGRESS
        room.last_move_at = datetime.utcnow()
        return self.room_repo.update_room(room)

    def leave_room(self, room_id: str, user_id: str) -> Room | None:
        '''
        Leave a room
        '''
        room = self.room_repo.get_room(room_id)
        if not room:
            return None
        if room.host_id == user_id:
            guest_id = room.guest_id
            room.guest_id = None
            if room.status == RoomStatus.IN_PROGRESS and guest_id:
                room.status = RoomStatus.COMPLETED
                room.result = GameResult.BLACK_WINS.value
            else:
                room.status = RoomStatus.WAITING
        elif room.guest_id == user_id:
            room.guest_id = None
            if room.status == RoomStatus.IN_PROGRESS:
                room.status = RoomStatus.WAITING
        return self.room_repo.update_room(room)

    def get_room(self, room_id: str) -> Room | None:
        '''
        Get a room by ID
        '''
        return self.room_repo.get_room(room_id)

    def get_room_players(self, room: Room) -> dict:
        '''
        Get the players in a room
        '''
        host = self.user_repo.get_user(room.host_id)
        guest = self.user_repo.get_user(room.guest_id) if room.guest_id else None
        return {
            "host": host.to_public() if host else None,
            "guest": guest.to_public() if guest else None,
        }

    def update_room_state(
        self,
        room_id: str,
        fen: str,
        pgn: str,
        white_time_ms: int,
        black_time_ms: int,
    ) -> Room | None:
        '''
        Update the state of a room
        '''
        room = self.room_repo.get_room(room_id)
        if not room:
            return None
        room.fen = fen
        room.pgn = pgn
        room.white_time_ms = white_time_ms
        room.black_time_ms = black_time_ms
        room.last_move_at =  datetime.now(timezone.utc)
        return self.room_repo.update_room(room)

    def complete_room(self, room_id: str, result: str, pgn: str) -> Room | None:
        '''
        Complete a room
        '''
        room = self.room_repo.get_room(room_id)
        if not room:
            return None
        room.status = RoomStatus.COMPLETED
        room.result = result
        room.pgn = pgn
        return self.room_repo.update_room(room)

    def initial_fen(self) -> str:
        '''
        Get the initial FEN for a new game
        '''
        return chess.Board().fen()
