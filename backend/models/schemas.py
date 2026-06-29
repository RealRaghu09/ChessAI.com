from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserUpdateRequest(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=32)
    avatar_url: str | None = None


class TimeControl(BaseModel):
    initial_ms: int = 600_000
    increment_ms: int = 0


class HealthResponse(BaseModel):
    status: str
    storage_backend: str
