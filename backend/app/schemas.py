from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional

# 공통 설정 (ORM 객체를 Pydantic 모델로 변환 허용)
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------------
# PRODUCTS
# -------------------------------------------------------------------
class ProductBase(BaseSchema):
    name: str
    type: str
    price: int
    value: int
    is_exposured: bool = True

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    product_id: int

# -------------------------------------------------------------------
# SEATS
# -------------------------------------------------------------------
class SeatBase(BaseSchema):
    type: str
    is_status: bool = True

class SeatCreate(SeatBase):
    pass

class SeatResponse(SeatBase):
    seat_id: int

# -------------------------------------------------------------------
# MEMBERS
# -------------------------------------------------------------------
class MemberBase(BaseSchema):
    name: Optional[str] = None

class MemberCreate(MemberBase):
    login_id: str
    password: str
    phone: Optional[str] = None

class MemberLogin(MemberBase):
    login_id: Optional[str] = None
    password: Optional[str] = None

class MemberResponse(MemberBase):
    login_id: Optional[str] = None
    password: Optional[str] = None
    email: Optional[str] = None

class MemberGoogleSetup(BaseSchema):
    phone: str
    birthday: str

# -------------------------------------------------------------------
# TOKENS
# -------------------------------------------------------------------
class TokenBase(BaseSchema):
    member_id: int
    token: str
    expires_at: Optional[datetime] = None

class TokenCreate(TokenBase):
    pass

class TokenResponse(TokenBase):
    is_revoked: bool
    created_at: datetime

# -------------------------------------------------------------------
# ORDERS
# -------------------------------------------------------------------
class OrderBase(BaseSchema):
    member_id: Optional[int] = None
    product_id: Optional[int] = None
    buyer_phone: Optional[str] = None
    payment_amount: int

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    order_id: int
    created_at: datetime

# -------------------------------------------------------------------
# SEAT_USAGE
# -------------------------------------------------------------------
class SeatUsageBase(BaseSchema):
    seat_id: Optional[int] = None
    member_id: Optional[int] = None
    order_id: Optional[int] = None

class SeatUsageCreate(SeatUsageBase):
    pass

class SeatUsageResponse(SeatUsageBase):
    usage_id: int
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    ticket_expired_time: Optional[datetime] = None

# -------------------------------------------------------------------
# MILEAGE_HISTORY
# -------------------------------------------------------------------
class MileageHistoryBase(BaseSchema):
    amount: int
    type: str

class MileageHistoryCreate(MileageHistoryBase):
    member_id: int

class MileageHistoryResponse(MileageHistoryBase):
    history_id: int
    member_id: int
    created_at: datetime

# -------------------------------------------------------------------
# 키오스크 AUTH (추가)
# -------------------------------------------------------------------
class PinAuthRequest(BaseSchema):
    phone: str
    pin: int