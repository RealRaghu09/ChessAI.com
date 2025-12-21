from ast import Dict, List
from datetime import datetime
import json
from typing import Any, Optional
import chess
from chess.svg import board

from backend.messages import GAME_OVER, INIT_GAME, MOVE

class Game:
    player1 : Optional[Dict[str, Any]]
    player2 : Optional[Dict[str, Any]]
    board : chess
    moves : List[str]
    __startTime : datetime
    def __init__(self,player1 , player2) -> None:
        self.__player1 = player1
        self.__player2 = player2
        self.__moves = []
        self.__board = chess.Board()
        self.startTime  = datetime()
        self.player1.send(json.dump({
            "type" : INIT_GAME , 
            'pay_load' : {
                'color' : 'white'
            }
        }))
        self.player2.send(json.dump({
            "type" : INIT_GAME , 
            'pay_load' : {
                'color' : 'black'
            }
        }))
    def makeMove(self,socket , move:dict['from' : str , 'to' : str ]):
        if (len(self.board.Move()) % 2 == 0 or socket != self.player1): return 
        if (len(self.board.Move()) % 2 == 1 or socket != self.player2): return 
        try:
            Nf3 = chess.Move.from_uci(move)
            self.board.Move(Nf3)
            
        except Exception:
            return 
        if self.board.is_checkmate():
            self.player1.emit(json.dump({
                'type':GAME_OVER,
                'pay_load' : {
                    'winner' : "black" if self.board.turn == 'w'  else 'white'
                }
            }))
            self.player2.emit(json.dump({
                'type':GAME_OVER,
                'pay_load' : {
                    'winner' : "black" if self.board.turn == 'w'  else 'white'
                }
            }))
            return 
        if len(self.board.Move()) % 2 == 0:
            self.player2.emit(json.dump({
                'type' : 'move',
                'pay_load' : MOVE
            }))
        else :
            self.player1.emit(json.dump({
                'type' : 'move',
                'pay_load' : MOVE
            }))