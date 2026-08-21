import json
import time
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

from auth.jwt import decode_access_token
from models.domain import RoomStatus
from repositories.base import get_user_repository
from services.chat_service import ChatService
from services.game_service import GameService
from services.ranking_service import RankingService
from services.room_service import RoomService
from websocket import events as E
from websocket.connection_manager import ConnectionManager


manager = ConnectionManager()
room_service = RoomService()
chat_service = ChatService()
ranking_service = RankingService()
active_games: dict[str, GameService] = {}


def _get_payload(message: dict) -> dict:
    return message.get("payload") or message.get("pay_load") or {}


async def authenticate_ws(websocket: WebSocket) -> str | None:
    token = websocket.query_params.get("token")
    if not token:
        return None
    print("TOKEN", token);
    data = decode_access_token(token)
    print("DATA", data)
    if not data or not data.get("sub"):
        return None
    print("SUB", data["sub"])
    print("=" * 60)
    return data["sub"]


async def handle_websocket(websocket: WebSocket) -> None:
    print("=" * 60)
    print("STEP 1: ENTER handle_websocket")
    user_id = await authenticate_ws(websocket)
    if not user_id:
        await websocket.close(code=4001)
        return
    print("STEP 3: got repo")
    user_repo = get_user_repository()
    user = user_repo.get_user(user_id)
    print("STEP 4: user =", user)
    
    storage = user_repo.storage
    
    if not user:
        print(" USER NOT FOUND")
        await websocket.close(code=4001)
        return
    print("STEP 5: CONNECTING")
    await manager.connect(user_id, websocket)
    try:
        user_repo.set_online_status(user_id, True)
        await manager.broadcast_all(E.USER_ONLINE, {"userId": user_id, "username": user.username})
        await manager.send_to_user(
            user_id,
            E.AUTH_CONNECTED,
            {"userId": user.id, "username": user.username, "elo": user.elo},
        )
        print("STEP 6: CONNECTED")
        rate_window: list[float] = []

        while True:
            raw = await websocket.receive_text()
            now = time.time()
            rate_window = [t for t in rate_window if now - t < 1.0]
            if len(rate_window) >= 30:
                await manager.send_to_user(user_id, E.ERROR, {"message": "Rate limit exceeded"})
                continue
            rate_window.append(now)

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send_to_user(user_id, E.ERROR, {"message": "Invalid JSON"})
                continue

            await route_message(user_id, message)
    except WebSocketDisconnect:
        print(f"There is an error with ws will notify : {WebSocketDisconnect} with user id {user_id}") 
    finally:
        if manager.disconnect(user_id, websocket):
            user_repo.set_online_status(user_id, False)
            await manager.broadcast_all(E.USER_OFFLINE, {"userId": user_id})


async def route_message(user_id: str, message: dict[str, Any]) -> None:
    event_type = message.get("type", "")
    payload = _get_payload(message)

    if event_type == E.INIT_GAME:
        await handle_room_create(user_id, {})
        return
    if event_type == E.MOVE:
        room_id = manager.get_user_room(user_id)
        if room_id:
            await handle_game_move(user_id, {"roomId": room_id, "move": message.get("move", {})})
        return

    handlers = {
        E.ROOM_CREATE: handle_room_create,
        E.ROOM_JOIN: handle_room_join,
        E.ROOM_LEAVE: handle_room_leave,
        E.ROOM_RECONNECT: handle_room_reconnect,
        E.GAME_MOVE: handle_game_move,
        E.GAME_RESIGN: handle_game_resign,
        E.GAME_DRAW_OFFER: handle_draw_offer,
        E.GAME_DRAW_RESPONSE: handle_draw_response,
        E.CHAT_SEND: handle_chat_send,
        E.CHAT_TYPING: handle_chat_typing,
        E.REACTION_ADD: handle_reaction_add,
    }
    handler = handlers.get(event_type)
    if handler:
        await handler(user_id, payload)
    else:
        await manager.send_to_user(user_id, E.ERROR, {"message": f"Unknown event: {event_type}"})


async def handle_room_create(user_id: str, payload: dict) -> None:
    room = room_service.create_room(user_id, payload.get("timeControl"))
    manager.set_user_room(user_id, room.id)
    await manager.send_to_user(
        user_id,
        E.ROOM_CREATED,
        {"roomId": room.id, "roomCode": room.room_code, "status": room.status.value},
    )


async def handle_room_join(user_id: str, payload: dict) -> None:
    room_code = payload.get("roomCode", "")
    room = room_service.join_room(room_code, user_id)
    manager.set_user_room(room.host_id, room.id)
    manager.set_user_room(user_id, room.id)
    players = room_service.get_room_players(room)
    joined_payload = {
        "roomId": room.id,
        "roomCode": room.room_code,
        "status": room.status.value,
        "host": players["host"],
        "guest": players["guest"],
    }
    await manager.broadcast_room(room.id, E.ROOM_JOINED, joined_payload)
    active_games[room.id] = GameService(room)
    game = active_games[room.id]
    sync = game.sync_state()
    start_payload = {
        "roomId": room.id,
        "fen": sync["fen"],
        "whiteUserId": sync["white_user_id"],
        "blackUserId": sync["black_user_id"],
        "clocks": sync["clocks"],
        "host": players["host"],
        "guest": players["guest"],
    }
    await manager.broadcast_room(room.id, E.GAME_START, start_payload)


async def handle_room_leave(user_id: str, payload: dict) -> None:
    room_id = payload.get("roomId") or manager.get_user_room(user_id)
    if not room_id:
        return
    room = room_service.leave_room(room_id, user_id)
    manager.user_rooms.pop(user_id, None)
    if room:
        await manager.broadcast_room(
            room_id,
            E.ROOM_STATUS,
            {"roomId": room_id, "status": room.status.value},
        )


async def handle_room_reconnect(user_id: str, payload: dict) -> None:
    room_id = payload.get("roomId") or manager.get_user_room(user_id)
    if not room_id:
        return
    room = room_service.get_room(room_id)
    if not room:
        return
    manager.set_user_room(user_id, room_id)
    if room.id not in active_games:
        active_games[room.id] = GameService(room)
    game = active_games[room.id]
    sync = game.sync_state()
    players = room_service.get_room_players(room)
    color = "white" if user_id == room.host_id else "black" if user_id == room.guest_id else None
    await manager.send_to_user(
        user_id,
        E.GAME_START,
        {
            "roomId": room.id,
            "fen": sync["fen"],
            "pgn": sync["pgn"],
            "whiteUserId": sync["white_user_id"],
            "blackUserId": sync["black_user_id"],
            "clocks": sync["clocks"],
            "turn": sync["turn"],
            "color": color,
            "host": players["host"],
            "guest": players["guest"],
            "reconnected": True,
        },
    )
    history = chat_service.get_history(room_id)
    for msg in history:
        await manager.send_to_user(
            user_id,
            E.CHAT_RECEIVE,
            {
                "roomId": room_id,
                "senderId": msg.sender_id,
                "username": msg.sender_username,
                "content": msg.content,
                "timestamp": msg.sent_at.isoformat(),
            },
        )


async def handle_game_move(user_id: str, payload: dict) -> None:
    room_id = payload.get("roomId") or manager.get_user_room(user_id)
    if not room_id:
        return
    if room_id not in active_games:
        room = room_service.get_room(room_id)
        if room:
            active_games[room_id] = GameService(room)
    game = active_games.get(room_id)
    if not game:
        return

    result = game.make_move(user_id, payload.get("move", {}))
    if not result.get("ok"):
        await manager.send_to_user(
            user_id,
            E.GAME_MOVE_REJECTED,
            {"roomId": room_id, "reason": result.get("reason"), "fen": result.get("fen")},
        )
        return

    room_service.update_room_state(
        room_id,
        result["fen"],
        result["pgn"],
        result["clocks"]["white_ms"],
        result["clocks"]["black_ms"],
    )
    move_payload = {
        "roomId": room_id,
        "move": result["move"],
        "fen": result["fen"],
        "pgn": result["pgn"],
        "turn": result["turn"],
        "clocks": result["clocks"],
    }
    await manager.broadcast_room(room_id, E.GAME_MOVE, move_payload)

    if result.get("end"):
        await _end_game(room_id, result["end"]["result"], result["end"].get("reason", ""), result["pgn"])


async def handle_game_resign(user_id: str, payload: dict) -> None:
    room_id = payload.get("roomId") or manager.get_user_room(user_id)
    if not room_id or room_id not in active_games:
        return
    result = active_games[room_id].resign(user_id)
    if result.get("ok"):
        await _end_game(room_id, result["result"], result["reason"], result["pgn"])


async def handle_draw_offer(user_id: str, payload: dict) -> None:
    room_id = payload.get("roomId") or manager.get_user_room(user_id)
    if room_id:
        manager.draw_offers[room_id] = user_id
        await manager.broadcast_room(
            room_id, E.GAME_DRAW_OFFER, {"roomId": room_id, "offeredBy": user_id}
        )


async def handle_draw_response(user_id: str, payload: dict) -> None:
    room_id = payload.get("roomId") or manager.get_user_room(user_id)
    if not room_id or room_id not in active_games:
        return
    if payload.get("accept") and room_id in manager.draw_offers:
        result = active_games[room_id].accept_draw()
        await _end_game(room_id, result["result"], result["reason"], result["pgn"])
    manager.draw_offers.pop(room_id, None)


async def _end_game(room_id: str, result: str, reason: str, pgn: str) -> None:
    room = room_service.complete_room(room_id, result, pgn)
    if room:
        ranking_service.record_match(room, result, pgn)
    end_payload = {"roomId": room_id, "result": result, "reason": reason, "pgn": pgn}
    await manager.broadcast_room(room_id, E.GAME_END, end_payload)
    winner = None
    if result == "white_wins":
        winner = "white"
    elif result == "black_wins":
        winner = "black"
    if winner:
        legacy = {"type": E.GAME_OVER, "payload": {"winner": winner}}
        for uid in manager.get_room_user_ids(room_id):
            ws = manager.active.get(uid)
            if ws:
                await ws.send_text(json.dumps(legacy))
    active_games.pop(room_id, None)
    manager.draw_offers.pop(room_id, None)


async def handle_chat_send(user_id: str, payload: dict) -> None:
    room_id = payload.get("roomId") or manager.get_user_room(user_id)
    content = payload.get("content", "").strip()
    if not room_id or not content:
        return
    user_repo = get_user_repository()
    user = user_repo.get_user(user_id)
    if not user:
        return
    msg = chat_service.send_message(room_id, user_id, user.username, content)
    await manager.broadcast_room(
        room_id,
        E.CHAT_RECEIVE,
        {
            "roomId": room_id,
            "senderId": user_id,
            "username": user.username,
            "content": msg.content,
            "timestamp": msg.sent_at.isoformat(),
        },
    )


async def handle_chat_typing(user_id: str, payload: dict) -> None:
    room_id = payload.get("roomId") or manager.get_user_room(user_id)
    if not room_id:
        return
    user_repo = get_user_repository()
    user = user_repo.get_user(user_id)
    await manager.broadcast_room(
        room_id,
        E.CHAT_TYPING,
        {"roomId": room_id, "userId": user_id, "username": user.username if user else "", "isTyping": payload.get("isTyping", True)},
        exclude=user_id,
    )


async def handle_reaction_add(user_id: str, payload: dict) -> None:
    room_id = payload.get("roomId") or manager.get_user_room(user_id)
    emoji = payload.get("emoji", "")
    if not room_id or not emoji:
        return
    user_repo = get_user_repository()
    user = user_repo.get_user(user_id)
    if not user:
        return
    try:
        reaction = chat_service.add_reaction(room_id, user_id, user.username, emoji)
    except ValueError:
        return
    await manager.broadcast_room(
        room_id,
        E.REACTION_UPDATE,
        {
            "roomId": room_id,
            "userId": user_id,
            "username": user.username,
            "emoji": reaction.emoji,
            "timestamp": reaction.created_at.isoformat(),
        },
    )
