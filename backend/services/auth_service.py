from config import get_settings
from models.domain import User
from models.schemas import LoginRequest, RegisterRequest
from auth.jwt import create_access_token
from auth.password import hash_password, verify_password
from repositories.base import get_user_repository


class AuthService:
    def __init__(self):
        self.user_repo = get_user_repository()
        self.settings = get_settings()

    def register(self, data: RegisterRequest) -> tuple[User, str]:
        '''
        Register a new user
        '''
        if self.user_repo.get_user_by_email(data.email):
            raise ValueError("Email already registered")
        if self.user_repo.get_user_by_username(data.username):
            raise ValueError("Username already taken")

        user = User(
            username=data.username,
            email=data.email,
            password_hash=hash_password(data.password),
            elo=self.settings.default_elo
        )
        user = self.user_repo.create_user(user)
        token = create_access_token({"sub": user.id})
        return user, token

    def login(self, data: LoginRequest) -> tuple[User, str]:
        '''
        Login a user
        '''
        user = self.user_repo.get_user_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise ValueError("Invalid email or password")
        token = create_access_token({"sub": user.id})
        return user, token

    def get_user(self, user_id: str) -> User | None:
        '''
        Get a user by ID
        '''
        return self.user_repo.get_user(user_id)
