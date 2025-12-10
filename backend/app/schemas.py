from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ----------------------------------------------------------------------------------------------------------------------
# Web Auth
# ----------------------------------------------------------------------------------------------------------------------
class MemberBase(BaseSchema):
    pass

class MemberSignup(MemberBase):
    name: str
    login_id: str
    password: str
    phone: str
    email: str
    birthday: str
    pin_code: str

class MemberLogin(MemberBase):
    login_id: str
    password: str

class MemberGoogleOnboarding(MemberBase):
    phone: str
    birthday: str
    pin_code: str

class TokenBase(BaseSchema):
    member_id: int
    token: str
    expires_at: Optional[datetime] = None

class TokenResponse(TokenBase):
    is_revoked: bool
    created_at: datetime

# ----------------------------------------------------------------------------------------------------------------------
# 키오스크 AUTH (추가)
# ----------------------------------------------------------------------------------------------------------------------
class PinAuthRequest(BaseSchema):
    phone: str
    pin: int