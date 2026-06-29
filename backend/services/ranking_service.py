from datetime import datetime

from config import get_settings
from models.domain import EloHistory, Match, Room
from repositories.base import get_chat_repository, get_match_repository, get_user_repository
from utils.elo import calculate_elo


class RankingService:
    def __init__(self):
        '''
        Initialize the ranking service
        '''
        self.user_repo = get_user_repository()
        self.match_repo = get_match_repository()
        self.chat_repo = get_chat_repository()
        self.settings = get_settings()

    def _score_for_result(self, result: str, color: str) -> float:
        '''
        Get the score for a result
        '''
        if result == "draw":
            return 0.5
        if result == "white_wins":
            return 1.0 if color == "white" else 0.0
        if result == "black_wins":
            return 1.0 if color == "black" else 0.0
        return 0.5

    def record_match(self, room: Room, result: str, pgn: str) -> Match | None:
        '''
        Record a match
        '''
        if not room.guest_id:
            return None
        white_user = self.user_repo.get_user(room.host_id)
        black_user = self.user_repo.get_user(room.guest_id)
        if not white_user or not black_user:
            return None

        white_before = white_user.elo
        black_before = black_user.elo
        white_score = self._score_for_result(result, "white")
        black_score = self._score_for_result(result, "black")
        white_after = calculate_elo(white_before, black_before, white_score, self.settings.elo_k_factor)
        black_after = calculate_elo(black_before, white_before, black_score, self.settings.elo_k_factor)

        duration = int((datetime.utcnow() - room.created_at).total_seconds())
        match = Match(
            room_id=room.id,
            white_user_id=white_user.id,
            black_user_id=black_user.id,
            pgn=pgn,
            result=result,
            duration_seconds=duration,
            white_elo_before=white_before,
            black_elo_before=black_before,
            white_elo_after=white_after,
            black_elo_after=black_after,
        )
        self.match_repo.create_match(match)

        for user, before, after, color in [
            (white_user, white_before, white_after, "white"),
            (black_user, black_before, black_after, "black"),
        ]:
            self._update_user_stats(user, result, color, after)
            self.chat_repo.add_elo_history(
                EloHistory(user_id=user.id, elo=after, match_id=match.id)
            )

        return match

    def _update_user_stats(self, user, result: str, color: str, new_elo: int) -> None:
        '''
        Update the user stats
        '''
        user.elo = new_elo
        user.total_matches += 1
        score = self._score_for_result(result, color)
        if score == 1.0:
            user.wins += 1
            user.current_streak = user.current_streak + 1 if user.current_streak >= 0 else 1
        elif score == 0.0:
            user.losses += 1
            user.current_streak = user.current_streak - 1 if user.current_streak <= 0 else -1
        else:
            user.draws += 1
            user.current_streak = 0
        if user.total_matches:
            user.win_percentage = round((user.wins / user.total_matches) * 100, 2)
        self.user_repo.update_user(user)

    def get_leaderboard(self, limit: int = 50) -> list[dict]:
        '''
        Get the leaderboard
        '''
        users = self.user_repo.list_users_by_elo(limit)
        return [u.to_public() for u in users]
