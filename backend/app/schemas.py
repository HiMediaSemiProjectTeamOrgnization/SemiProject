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
    login_id: Optional[str] = None
    phone: str
    email: EmailStr
    age: Optional[int] = None
    social_type: Optional[str] = None
    pin_code: Optional[int] = None

class MemberCreate(MemberBase):
    password: Optional[str] = None

class MemberUpdate(BaseSchema):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    pin_code: Optional[int] = None

class MemberResponse(MemberBase):
    member_id: int
    total_mileage: int
    saved_time_minute: int
    period_start_date: Optional[datetime] = None
    period_end_date: Optional[datetime] = None
    fixed_seat_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_deleted_at: bool

# -------------------------------------------------------------------
# TOKENS
# -------------------------------------------------------------------
class TokenCreate(BaseSchema):
    member_id: int
    token: str
    expires_at: Optional[datetime] = None

class TokenResponse(BaseSchema):
    token_id: int
    token: str
    expires_at: Optional[datetime] = None
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