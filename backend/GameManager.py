from ast import Dict
import json
from typing import Any, List, Optional

from backend.messages import INIT_GAME

class GameManager:
    __games : List[Game]
    __pendingUser :Optional[Dict[str, Any]]#Websocket
    __users : List[Optional[Dict[str , Any]]] #WebSocket[]
    def __init__(self) -> None:
        self.__games = []

    def addUser(self , socket) : 
        self.__users.append(socket)
        self.addHandler(socket)
    def removeUser(self, socket, server):
        self.__users = [
            user for user in self.__users
            if user["id"] != socket["id"]
        ]

    def addHandler(socket:Optional[Dict[str, Any]]):
        socket.on("message" ,   (data) =>{
            const message  = JSON.parse(data.toString())
            if (message.type == INIT_GAME){
                if (this.pendingUser){
                    #start the game 
                }
            }else {
                this.pendingUser = socket
            }
        })
    def handleMessage(self, socket: Dict[str, Any], server, raw_message: str) -> None:
            message = json.loads(raw_message)

            if message.get("type") == INIT_GAME:
                if self.pendingUser is not None:
                    # start the game
                    print(
                        f"Starting game between "
                        f"{self.pendingUser['id']} and {socket['id']}"
                    )

                    # reset pending user after match
                    self.pendingUser = None
                else:
                    # no one waiting, make this user pending
                    self.pendingUser = socket
            else:
                # any other message type
                self.pendingUser = socket