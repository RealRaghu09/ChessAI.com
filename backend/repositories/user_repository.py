import json
from datetime import datetime

from models.domain import ChatMessage, EloHistory, Match, Reaction, Room, User
from storage.postgres import (
    ChatMessageORM,
    EloHistoryORM,
    JsonStorage,
    MatchORM,
    PostgresStorage,
    ReactionORM,
    RoomORM,
    UserORM,
)


class UserRepository:
    def __init__(self, storage):
        self.storage = storage

    def create_user(self, user: User) -> User:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                session.add(UserORM(**user.model_dump()))
                session.commit()
            return user
        return self.storage.users.create(user)

    def get_user(self, user_id: str) -> User | None:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                row = session.get(UserORM, user_id)
                return User.model_validate(row.__dict__) if row else None
        return self.storage.users.get_by_id(user_id)

    def get_user_by_email(self, email: str) -> User | None:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                row = session.query(UserORM).filter(UserORM.email == email).first()
                return User.model_validate(row.__dict__) if row else None
        return self.storage.users.find_one(lambda u: u.email == email)

    def get_user_by_username(self, username: str) -> User | None:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                row = session.query(UserORM).filter(UserORM.username == username).first()
                return User.model_validate(row.__dict__) if row else None
        return self.storage.users.find_one(lambda u: u.username == username)

    def update_user(self, user: User) -> User:
        user.last_active_at = datetime.utcnow()
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                row = session.get(UserORM, user.id)
                if row:
                    for key, value in user.model_dump().items():
                        setattr(row, key, value)
                    session.commit()
            return user
        return self.storage.users.update(user)

    def list_users_by_elo(self, limit: int = 50) -> list[User]:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                rows = session.query(UserORM).order_by(UserORM.elo.desc()).limit(limit).all()
                return [User.model_validate(r.__dict__) for r in rows]
        users = self.storage.users.list_all()
        users.sort(key=lambda u: u.elo, reverse=True)
        return users[:limit]

    def set_online_status(self, user_id: str, is_online: bool) -> User | None:
        user = self.get_user(user_id)
        if not user:
            return None
        user.is_online = is_online
        user.last_active_at = datetime.utcnow()
        return self.update_user(user)


class RoomRepository:
    def __init__(self, storage):
        self.storage = storage

    def _room_to_orm_data(self, room: Room) -> dict:
        data = room.model_dump()
        data["spectator_ids"] = json.dumps(room.spectator_ids)
        data["status"] = room.status.value if hasattr(room.status, "value") else room.status
        return data

    def create_room(self, room: Room) -> Room:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                session.add(RoomORM(**self._room_to_orm_data(room)))
                session.commit()
            return room
        return self.storage.rooms.create(room)

    def get_room(self, room_id: str) -> Room | None:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                row = session.get(RoomORM, room_id)
                if not row:
                    return None
                data = row.__dict__.copy()
                data["spectator_ids"] = json.loads(data.get("spectator_ids") or "[]")
                return Room.model_validate(data)
        return self.storage.rooms.get_by_id(room_id)

    def get_room_by_code(self, room_code: str) -> Room | None:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                row = session.query(RoomORM).filter(RoomORM.room_code == room_code.upper()).first()
                if not row:
                    return None
                data = row.__dict__.copy()
                data["spectator_ids"] = json.loads(data.get("spectator_ids") or "[]")
                return Room.model_validate(data)
        return self.storage.rooms.find_one(lambda r: r.room_code == room_code.upper())

    def update_room(self, room: Room) -> Room:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                row = session.get(RoomORM, room.id)
                if row:
                    data = self._room_to_orm_data(room)
                    for key, value in data.items():
                        setattr(row, key, value)
                    session.commit()
            return room
        return self.storage.rooms.update(room)

    def list_active_rooms(self) -> list[Room]:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                rows = session.query(RoomORM).filter(RoomORM.status != "completed").all()
                result = []
                for row in rows:
                    data = row.__dict__.copy()
                    data["spectator_ids"] = json.loads(data.get("spectator_ids") or "[]")
                    result.append(Room.model_validate(data))
                return result
        return self.storage.rooms.find_many(lambda r: r.status.value != "completed")


class MatchRepository:
    def __init__(self, storage):
        self.storage = storage

    def create_match(self, match: Match) -> Match:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                session.add(MatchORM(**match.model_dump()))
                session.commit()
            return match
        return self.storage.matches.create(match)

    def get_matches_for_user(self, user_id: str, limit: int = 20) -> list[Match]:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                rows = (
                    session.query(MatchORM)
                    .filter(
                        (MatchORM.white_user_id == user_id) | (MatchORM.black_user_id == user_id)
                    )
                    .order_by(MatchORM.ended_at.desc())
                    .limit(limit)
                    .all()
                )
                return [Match.model_validate(r.__dict__) for r in rows]
        matches = self.storage.matches.find_many(
            lambda m: m.white_user_id == user_id or m.black_user_id == user_id
        )
        matches.sort(key=lambda m: m.ended_at, reverse=True)
        return matches[:limit]


class ChatRepository:
    def __init__(self, storage):
        self.storage = storage

    def add_message(self, message: ChatMessage) -> ChatMessage:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                session.add(ChatMessageORM(**message.model_dump()))
                session.commit()
            return message
        return self.storage.chat_messages.create(message)

    def get_messages(self, room_id: str, limit: int = 100) -> list[ChatMessage]:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                rows = (
                    session.query(ChatMessageORM)
                    .filter(ChatMessageORM.room_id == room_id)
                    .order_by(ChatMessageORM.sent_at.asc())
                    .limit(limit)
                    .all()
                )
                return [ChatMessage.model_validate(r.__dict__) for r in rows]
        messages = self.storage.chat_messages.find_many(lambda m: m.room_id == room_id)
        messages.sort(key=lambda m: m.sent_at)
        return messages[-limit:]

    def add_reaction(self, reaction: Reaction) -> Reaction:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                session.add(ReactionORM(**reaction.model_dump()))
                session.commit()
            return reaction
        return self.storage.reactions.create(reaction)

    def get_reactions(self, room_id: str, limit: int = 50) -> list[Reaction]:
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                rows = (
                    session.query(ReactionORM)
                    .filter(ReactionORM.room_id == room_id)
                    .order_by(ReactionORM.created_at.desc())
                    .limit(limit)
                    .all()
                )
                return [Reaction.model_validate(r.__dict__) for r in rows]
        reactions = self.storage.reactions.find_many(lambda r: r.room_id == room_id)
        reactions.sort(key=lambda r: r.created_at, reverse=True)
        return reactions[:limit]

    def add_elo_history(self, entry: EloHistory) -> EloHistory:
        if isinstance(self.storage, JsonStorage):
            return self.storage.elo_history.create(entry)
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                session.add(EloHistoryORM(**entry.model_dump()))
                session.commit()
        return entry

    def get_elo_history(self, user_id: str, limit: int = 20) -> list[EloHistory]:
        if isinstance(self.storage, JsonStorage):
            history = self.storage.elo_history.find_many(lambda e: e.user_id == user_id)
            history.sort(key=lambda e: e.recorded_at, reverse=True)
            return history[:limit]
        if isinstance(self.storage, PostgresStorage):
            with self.storage.get_session() as session:
                rows = (
                    session.query(EloHistoryORM)
                    .filter(EloHistoryORM.user_id == user_id)
                    .order_by(EloHistoryORM.recorded_at.desc())
                    .limit(limit)
                    .all()
                )
                return [EloHistory.model_validate(r.__dict__) for r in rows]
        return []
