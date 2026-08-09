import json

from typing import Any

from fastapi import WebSocket



class ConnectionManager:
    def __init__(self):
        self.active: dict[str, WebSocket] = {}
        self.user_rooms: dict[str, str] = {}
        self.draw_offers: dict[str, str] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active[user_id] = websocket

    def disconnect(self, user_id: str) -> None:
        self.active.pop(user_id, None)
        self.user_rooms.pop(user_id, None)

    def set_user_room(self, user_id: str, room_id: str) -> None:
        self.user_rooms[user_id] = room_id

    def get_user_room(self, user_id: str) -> str | None:
        return self.user_rooms.get(user_id)

    def get_room_user_ids(self, room_id: str) -> list[str]:
        return [uid for uid, rid in self.user_rooms.items() if rid == room_id]

    async def send_to_user(self, user_id: str, event_type: str, payload: dict[str, Any]) -> None:
        ws = self.active.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps({"type": event_type, "payload": payload}))
            except Exception as exc:
                print(f"Failed to send to user {user_id}: {exc}")

    async def broadcast_room(
        self, room_id: str, event_type: str, payload: dict[str, Any], exclude: str | None = None
    ) -> None:
        for user_id in self.get_room_user_ids(room_id):
            if user_id != exclude:
                await self.send_to_user(user_id, event_type, payload)

    async def broadcast_all(self, event_type: str, payload: dict[str, Any]) -> None:
        for user_id in list(self.active.keys()):
            await self.send_to_user(user_id, event_type, payload)
