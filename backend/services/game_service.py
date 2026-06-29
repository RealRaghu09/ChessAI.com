from datetime import datetime

import chess
import chess.pgn

from models.domain import GameResult, Room


class GameService:
  def __init__(self, room: Room):
    self.room = room
    self.board = chess.Board(room.fen)
    self.moves: list[str] = []
    if room.pgn:
      try:
        game = chess.pgn.read_game(chess.pgn.StringIO(room.pgn))
        if game:
          self.board = game.board()
          self.moves = [m.uci() for m in game.mainline_moves()]
      except Exception:
        self.board = chess.Board(room.fen)

  def get_fen(self) -> str:
    return self.board.fen()

  def get_turn(self) -> str:
    return "white" if self.board.turn == chess.WHITE else "black"

  def get_pgn(self) -> str:
    game = chess.pgn.Game()
    node = game
    for uci in self.moves:
      move = chess.Move.from_uci(uci)
      node = node.add_variation(move)
    exporter = chess.pgn.StringExporter(headers=False, variations=False)
    return str(game.accept(exporter)).strip()

  def _color_for_user(self, user_id: str) -> str | None:
    if user_id == self.room.host_id:
      return "white"
    if user_id == self.room.guest_id:
      return "black"
    return None

  def _elapsed_ms(self) -> int:
    if not self.room.last_move_at:
      return 0
    return int((datetime.utcnow() - self.room.last_move_at).total_seconds() * 1000)

  def _apply_clock(self) -> tuple[int, int]:
    white_ms = self.room.white_time_ms
    black_ms = self.room.black_time_ms
    elapsed = self._elapsed_ms()
    if self.board.turn == chess.WHITE:
      white_ms = max(0, white_ms - elapsed)
    else:
      black_ms = max(0, black_ms - elapsed)
    return white_ms, black_ms

  def make_move(self, user_id: str, move_data: dict) -> dict:
    color = self._color_for_user(user_id)
    if not color:
      return {"ok": False, "reason": "not_a_player"}
    if (color == "white" and self.board.turn != chess.WHITE) or (
      color == "black" and self.board.turn != chess.BLACK
    ):
      return {"ok": False, "reason": "not_your_turn", "fen": self.get_fen()}

    white_ms, black_ms = self._apply_clock()
    from_sq = move_data.get("from", "")
    to_sq = move_data.get("to", "")
    uci = from_sq + to_sq
    if move_data.get("promotion"):
      uci += move_data["promotion"]

    try:
      chess_move = chess.Move.from_uci(uci)
      if chess_move not in self.board.legal_moves:
        return {"ok": False, "reason": "illegal_move", "fen": self.get_fen()}
      self.board.push(chess_move)
      self.moves.append(uci)
    except Exception:
      return {"ok": False, "reason": "invalid_move", "fen": self.get_fen()}

    if self.board.turn == chess.WHITE:
      black_ms += self.room.increment_ms
    else:
      white_ms += self.room.increment_ms

    self.room.white_time_ms = white_ms
    self.room.black_time_ms = black_ms
    self.room.last_move_at = datetime.utcnow()
    self.room.fen = self.get_fen()
    self.room.pgn = self.get_pgn()

    end = self._check_end()
    return {
      "ok": True,
      "move": move_data,
      "fen": self.get_fen(),
      "pgn": self.get_pgn(),
      "turn": self.get_turn(),
      "clocks": {"white_ms": white_ms, "black_ms": black_ms},
      "end": end,
    }

  def resign(self, user_id: str) -> dict:
    color = self._color_for_user(user_id)
    if not color:
      return {"ok": False, "reason": "not_a_player"}
    winner = "black" if color == "white" else "white"
    result = GameResult.WHITE_WINS if winner == "white" else GameResult.BLACK_WINS
    return {
      "ok": True,
      "result": result.value,
      "reason": "resignation",
      "winner": winner,
      "pgn": self.get_pgn(),
    }

  def accept_draw(self) -> dict:
    return {
      "ok": True,
      "result": GameResult.DRAW.value,
      "reason": "draw_agreement",
      "pgn": self.get_pgn(),
    }

  def _check_end(self) -> dict | None:
    if self.board.is_checkmate():
      winner = "black" if self.board.turn == chess.WHITE else "white"
      result = GameResult.WHITE_WINS if winner == "white" else GameResult.BLACK_WINS
      return {"result": result.value, "reason": "checkmate", "winner": winner}
    if self.board.is_stalemate():
      return {"result": GameResult.DRAW.value, "reason": "stalemate"}
    if self.board.is_insufficient_material():
      return {"result": GameResult.DRAW.value, "reason": "insufficient_material"}
    if self.board.can_claim_draw():
      return {"result": GameResult.DRAW.value, "reason": "draw_claim"}
    if self.room.white_time_ms <= 0:
      return {"result": GameResult.BLACK_WINS.value, "reason": "timeout", "winner": "black"}
    if self.room.black_time_ms <= 0:
      return {"result": GameResult.WHITE_WINS.value, "reason": "timeout", "winner": "white"}
    return None

  def sync_state(self) -> dict:
    white_ms, black_ms = self._apply_clock()
    color = self.get_turn()
    return {
      "fen": self.get_fen(),
      "pgn": self.get_pgn(),
      "turn": color,
      "clocks": {"white_ms": white_ms, "black_ms": black_ms},
      "white_user_id": self.room.host_id,
      "black_user_id": self.room.guest_id,
    }
