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
                print(f"Invalid move: {uci_move} not in legal moves")
                return
            self.__board.push(chess_move)
            self.__moves.append(uci_move)
            print(f"Move {uci_move} successfully applied. Move count: {len(self.__board.move_stack)}")
            
        except Exception as e:
            print(f"Error processing move: {e}")
            import traceback
            traceback.print_exc()
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
        
        # Notify both players about the move
        move_count = len(self.__board.move_stack)
        move_notification = json.dumps({
            'type': MOVE,
            'pay_load': move
        })
        
        try:
            if move_count % 2 == 1:
                # White just moved (odd number of moves), notify black
                print(f"White moved (move_count={move_count}), notifying black (player2 id={self.__player2['id']}) and white (player1 id={self.__player1['id']})")
                self.__server.send_message(self.__player2, move_notification)
                # Also send confirmation to white
                self.__server.send_message(self.__player1, move_notification)
            else:
                # Black just moved (even number of moves), notify white
                print(f"Black moved (move_count={move_count}), notifying white (player1 id={self.__player1['id']}) and black (player2 id={self.__player2['id']})")
                self.__server.send_message(self.__player1, move_notification)
                # Also send confirmation to black
                self.__server.send_message(self.__player2, move_notification)
        except Exception as e:
            print(f"Error sending move notification: {e}")
            import traceback
            traceback.print_exc()