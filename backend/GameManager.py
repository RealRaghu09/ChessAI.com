from typing import Any, Dict, List, Optional
import json

from Game import Game
from messages import INIT_GAME, MOVE

class GameManager:
    __games: List[Game]
    __pendingUser: Optional[Dict[str, Any]]  # Websocket
    __users: List[Optional[Dict[str, Any]]]  # WebSocket[]
    
    def __init__(self) -> None:
        self.__games = []
        self.__pendingUser = None
        self.__users = []

    def addUser(self, socket) -> None:
        self.__users.append(socket)
        # Note: Message handler should be set up in app.py

    def removeUser(self, socket, server) -> None:
        self.__users = [
            user for user in self.__users
            if user["id"] != socket["id"]
        ]
        # Also remove from pending if this user was pending
        if self.__pendingUser is not None and self.__pendingUser["id"] == socket["id"]:
            self.__pendingUser = None
        # Remove games involving this user
        self.__games = [
            game for game in self.__games
            if game._Game__player1["id"] != socket["id"] and game._Game__player2["id"] != socket["id"]
        ]

    def handleMessage(self, socket: Dict[str, Any], server, raw_message: str) -> None:
        message = json.loads(raw_message)
        message_type = message.get("type")

        if message_type == INIT_GAME:
            if self.__pendingUser is not None:
                # Create a new game
                pending_id = self.__pendingUser["id"]
                current_id = socket["id"]
                game = Game(self.__pendingUser, socket, server)
                self.__games.append(game)
                print(
                    f"Starting game between "
                    f"{pending_id} and {current_id}"
                )
                # reset pending user after match
                self.__pendingUser = None
            else:
                # no one waiting, make this user pending
                self.__pendingUser = socket
        elif message_type == MOVE:
            # Find the game this user is part of
            game = None
            for g in self.__games:
                if (g._Game__player1["id"] == socket["id"] or 
                    g._Game__player2["id"] == socket["id"]):
                    game = g
                    break

            if game is not None:
                game.makeMove(socket, message.get("move", {}))