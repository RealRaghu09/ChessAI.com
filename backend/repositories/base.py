from repositories.user_repository import ChatRepository, MatchRepository, RoomRepository, UserRepository
from storage.factory import get_storage_provider


def get_user_repository() -> UserRepository:
    return UserRepository(get_storage_provider())


def get_room_repository() -> RoomRepository:
    return RoomRepository(get_storage_provider())


def get_match_repository() -> MatchRepository:
    return MatchRepository(get_storage_provider())


def get_chat_repository() -> ChatRepository:
    return ChatRepository(get_storage_provider())
