from fastapi import APIRouter, Depends, HTTPException, Request, status

from api.deps import get_current_user
from api.limiter import limiter
from models.domain import User
from models.schemas import LoginRequest, RegisterRequest, TokenResponse
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_service() -> AuthService:
    return AuthService()


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
def register(request: Request, data: RegisterRequest):
    try:
        user, token = _auth_service().register(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return TokenResponse(access_token=token, user=user.to_public())


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def login(request: Request, data: LoginRequest):
    try:
        user, token = _auth_service().login(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return TokenResponse(access_token=token, user=user.to_public())


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return current_user.to_public()
