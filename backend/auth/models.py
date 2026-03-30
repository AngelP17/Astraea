
from pydantic import BaseModel


class User(BaseModel):
    id: str
    email: str
    hashed_password: str
    is_active: bool = True
    is_admin: bool = False


class UserCreate(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: str | None = None
