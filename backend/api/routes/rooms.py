from fastapi import APIRouter, Depends

from api.deps import get_current_user
from models.domain import User
from services.room_service import RoomService

router = APIRouter(prefix="/rooms", tags=["rooms"])
room_service = RoomService()


@router.post("")
def create_room(current_user: User = Depends(get_current_user)):
    room = room_service.create_room(current_user.id)
    return {
        "roomId": room.id,
        "roomCode": room.room_code,
        "status": room.status.value,
    }


@router.get("/{room_code}")
def get_room_by_code(room_code: str, current_user: User = Depends(get_current_user)):
    room = room_service.get_room_by_code(room_code)
    if not room:
        return {"error": "Room not found"}
    players = room_service.get_room_players(room)
    return {
        "roomId": room.id,
        "roomCode": room.room_code,
        "status": room.status.value,
        "host": players["host"],
        "guest": players["guest"],
    }
