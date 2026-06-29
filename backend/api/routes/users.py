from fastapi import APIRouter, Depends, HTTPException, status

from api.deps import get_current_user
from models.domain import User
from models.schemas import UserUpdateRequest
from repositories.base import get_match_repository, get_user_repository

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}")
def get_user(user_id: str):
    user = get_user_repository().get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    public = user.to_public()
    public.pop("email", None)
    return public


@router.patch("/me")
def update_me(data: UserUpdateRequest, current_user: User = Depends(get_current_user)):
    repo = get_user_repository()
    if data.username:
        existing = repo.get_user_by_username(data.username)
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username taken")
        current_user.username = data.username
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    updated = repo.update_user(current_user)
    return updated.to_public()


@router.get("/{user_id}/matches")
def get_user_matches(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    matches = get_match_repository().get_matches_for_user(user_id)
    return [m.model_dump() for m in matches]
