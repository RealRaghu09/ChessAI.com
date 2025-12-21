from datetime import datetime
import json
from typing import Any, Dict, List, Optional
import chess

from messages import GAME_OVER, INIT_GAME, MOVE

class Game:
    player1 : Optional[Dict[str, Any]]
    player2 : Optional[Dict[str, Any]]
    board : chess.Board
    moves : List[str]
    __startTime : datetime
    def __init__(self, player1, player2, server) -> None:
        self.__player1 = player1
        self.__player2 = player2
        self.__server = server
        self.__moves = []
        self.__board = chess.Board()
        self.__startTime = datetime.now()
        self.__server.send_message(
            self.__player1,
            json.dumps({
                "type": INIT_GAME,
                'pay_load': {
                    'color': 'white'
                }
            })
        )
        self.__server.send_message(
            self.__player2,
            json.dumps({
                "type": INIT_GAME,
                'pay_load': {
                    'color': 'black'
                }
            })
        )
    
    def makeMove(self, socket, move: Dict[str, str]) -> None:
        # Check if it's the correct player's turn
        move_count = len(self.__board.move_stack)
        is_white_turn = move_count % 2 == 0
        
        if is_white_turn and socket["id"] != self.__player1["id"]:
            return
        if not is_white_turn and socket["id"] != self.__player2["id"]:
            return
        
        try:
            # Convert move dict to UCI format
            from_square = move.get('from', '')
            to_square = move.get('to', '')
            uci_move = from_square + to_square
            # Check for promotion
            if 'promotion' in move:
                uci_move += move['promotion']
            
            chess_move = chess.Move.from_uci(uci_move)
            if chess_move not in self.__board.legal_moves:
                return
            self.__board.push(chess_move)
            self.__moves.append(uci_move)
            
        except Exception:
            return
        
        if self.__board.is_checkmate():
            winner = "black" if self.__board.turn == chess.WHITE else "white"
            self.__server.send_message(
                self.__player1,
                json.dumps({
                    'type': GAME_OVER,
                    'pay_load': {
                        'winner': winner
                    }
                })
            )
            self.__server.send_message(
                self.__player2,
                json.dumps({
                    'type': GAME_OVER,
                    'pay_load': {
                        'winner': winner
                    }
                })
            )
            return
        
        # Notify the other player about the move
        move_count = len(self.__board.move_stack)
        if move_count % 2 == 0:
            # White just moved, notify black
            self.__server.send_message(
                self.__player2,
                json.dumps({
                    'type': MOVE,
                    'pay_load': move
                })
            )
        else:
            # Black just moved, notify white
            self.__server.send_message(
                self.__player1,
                json.dumps({
                    'type': MOVE,
                    'pay_load': move
                })
            )