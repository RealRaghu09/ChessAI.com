from fastapi import APIRouter

from services.ranking_service import RankingService

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])
ranking_service = RankingService()


@router.get("")
def get_leaderboard(limit: int = 50):
    return ranking_service.get_leaderboard(limit)
