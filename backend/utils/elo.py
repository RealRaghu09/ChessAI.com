def expected_score(player_elo: int, opponent_elo: int) -> float:
    return 1 / (1 + 10 ** ((opponent_elo - player_elo) / 400))


def calculate_elo(player_elo: int, opponent_elo: int, score: float, k: int = 32) -> int:
    """score: 1.0 win, 0.5 draw, 0.0 loss"""
    expected = expected_score(player_elo, opponent_elo)
    return round(player_elo + k * (score - expected))
