from ast import Dict
import json
from typing import Any, List, Optional

from backend import Game
from backend.messages import INIT_GAME, MOVE

class GameManager:
    __games : List[Game]
    __pendingUser :Optional[Dict[str, Any]]#Websocket
    __users : List[Optional[Dict[str , Any]]] or None #WebSocket[]
    def __init__(self) -> None:
        self.__games = []
        self.pendingUser = None
        self.__users = []


    def addUser(self , socket) : 
        self.__users.append(socket)
        self.addHandler(socket)


    def removeUser(self, socket, server):
        self.__users = [
            user for user in self.__users
            if user["id"] != socket["id"]
        ]


    def handleMessage(self, socket: Dict[str, Any], server, raw_message: str) -> None:
            message = json.loads(raw_message)

            if message.get("type") == INIT_GAME:
                if self.pendingUser is not None:
                    game = Game(self.pendingUser , socket)
                    self.__games.append(game)
                    self.pendingUser = None
                    print(
                        f"Starting game between "
                        f"{self.pendingUser['id']} and {socket['id']}"
                    )

                    # reset pending user after match
                    self.pendingUser = None
                else:
                    # no one waiting, make this user pending
                    self.pendingUser = socket
                if message.get("type") == MOVE:
                    game = next(
                        (
                            g for g in self.games
                            if g.player1 == socket or g.player2 == socket
                        ),
                        None
                    )

                if game is not None:
                    game.makeMove(socket , message["move"])