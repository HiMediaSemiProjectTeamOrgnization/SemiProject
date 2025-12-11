from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, BigInteger, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from database import Base

# ----------------------------------------------------------------------------------------------------------------------
# PRODUCTS
# ----------------------------------------------------------------------------------------------------------------------
class Product(Base):
    __tablename__ = "products"

    product_id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    price = Column(Integer, nullable=False)
    value = Column(Integer, nullable=False)
    is_exposured = Column(Boolean, server_default="true")

    orders = relationship("Order", back_populates="product")

# ----------------------------------------------------------------------------------------------------------------------
# SEATS
# ----------------------------------------------------------------------------------------------------------------------
class Seat(Base):
    __tablename__ = "seats"

    seat_id = Column(BigInteger, primary_key=True, autoincrement=True)
    type = Column(String(10), nullable=False)
    is_status = Column(Boolean, server_default="true")
    near_window = Column(Boolean)
    corner_seat = Column(Boolean)
    aisle_seat = Column(Boolean)
    isolated = Column(Boolean)
    near_beverage_table = Column(Boolean)
    is_center = Column(Boolean)

    seat_usages = relationship("SeatUsage", back_populates="seat")

# ----------------------------------------------------------------------------------------------------------------------
# MEMBERS
# ----------------------------------------------------------------------------------------------------------------------
class Member(Base):
    __tablename__ = "members"

    member_id = Column(BigInteger, primary_key=True, autoincrement=True)
    login_id = Column(String(50), unique=True, nullable=True)
    password = Column(String(255), nullable=True)
    phone = Column(String(20), unique=True)
    email = Column(String(100), unique=True)
    birthday = Column(String(20), nullable=True)
    pin_code = Column(Integer, nullable=True)
    social_type = Column(String(20), nullable=True)
    total_mileage = Column(Integer, server_default="0")
    saved_time_minute = Column(Integer, server_default="0")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_deleted_at = Column(Boolean, server_default="false")
    name = Column(String(30), nullable=False)
    role = Column(String(20), nullable=False, server_default="user")
    kakao_id = Column(String(255), unique=True)
    naver_id = Column(String(255), unique=True)
    google_id = Column(String(255), unique=True)

    tokens = relationship("Token", back_populates="member", cascade="all, delete")
    orders = relationship("Order", back_populates="member")
    seat_usages = relationship("SeatUsage", back_populates="member", cascade="all, delete")
    mileage_history = relationship("MileageHistory", back_populates="member", cascade="all, delete")
    user_todos = relationship("UserTODO", back_populates="member", cascade="all, delete")
    ai_chat_logs = relationship("AIChatLog", back_populates="member", cascade="all, delete")
    study_plans = relationship("StudyPlan", back_populates="member", cascade="all, delete")

# ----------------------------------------------------------------------------------------------------------------------
# TOKENS
# ----------------------------------------------------------------------------------------------------------------------
class Token(Base):
    __tablename__ = "tokens"

    token_id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id", ondelete="CASCADE"))
    token = Column(String(512))
    expires_at = Column(DateTime, nullable=True)
    is_revoked = Column(Boolean, server_default="false")
    created_at = Column(DateTime, server_default=func.now())

    member = relationship("Member", back_populates="tokens")

# ----------------------------------------------------------------------------------------------------------------------
# ORDERS
# ----------------------------------------------------------------------------------------------------------------------
class Order(Base):
    __tablename__ = "orders"

    order_id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id", ondelete="SET NULL"), nullable=True)
    product_id = Column(BigInteger, ForeignKey("products.product_id", ondelete="SET NULL"), nullable=True)
    buyer_phone = Column(String(20), nullable=True)
    payment_amount = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    period_start_date = Column(DateTime, nullable=True)
    period_end_date = Column(DateTime, nullable=True)
    fixed_seat_id = Column(BigInteger, nullable=True)

    member = relationship("Member", back_populates="orders")
    product = relationship("Product", back_populates="orders")
    seat_usage = relationship("SeatUsage", back_populates="order", uselist=False)

# ----------------------------------------------------------------------------------------------------------------------
# SEAT_USAGE
# ----------------------------------------------------------------------------------------------------------------------
class SeatUsage(Base):
    __tablename__ = "seat_usage"

    usage_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("orders.order_id", ondelete="SET NULL"), nullable=True)
    seat_id = Column(BigInteger, ForeignKey("seats.seat_id", ondelete="SET NULL"), nullable=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id", ondelete="CASCADE"), nullable=True)
    check_in_time = Column(DateTime, server_default=func.now())
    check_out_time = Column(DateTime, nullable=True)
    is_attended = Column(Boolean, server_default="false")
    ticket_expired_time = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="seat_usage")
    seat = relationship("Seat", back_populates="seat_usages")
    member = relationship("Member", back_populates="seat_usages")

# ----------------------------------------------------------------------------------------------------------------------
# MILEAGE_HISTORY
# ----------------------------------------------------------------------------------------------------------------------
class MileageHistory(Base):
    __tablename__ = "mileage_history"

    history_id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id", ondelete="CASCADE"))
    amount = Column(Integer, nullable=False)
    type = Column(String(10), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    member = relationship("Member", back_populates="mileage_history")

# ----------------------------------------------------------------------------------------------------------------------
# TODOS
# ----------------------------------------------------------------------------------------------------------------------
class TODO(Base):
    __tablename__ = "todos"

    todo_id = Column(BigInteger, primary_key=True, autoincrement=True)
    todo_type = Column(String(20))
    todo_title = Column(String(100))
    todo_content = Column(Text)
    todo_value = Column(Integer)
    betting_mileage = Column(Integer)
    payback_mileage_percent = Column(Integer)
    is_exposed = Column(Boolean, server_default="true")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user_todos = relationship("UserTODO", back_populates="todos", cascade="all, delete")

# ----------------------------------------------------------------------------------------------------------------------
# USER_TODOS
# ----------------------------------------------------------------------------------------------------------------------
class UserTODO(Base):
    __tablename__ = "user_todos"

    user_todo_id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id", ondelete="SET NULL"), nullable=True)
    todo_id = Column(BigInteger, ForeignKey("todos.todo_id", ondelete="SET NULL"), nullable=True)
    is_achieved = Column(Boolean, server_default="false")
    started_at = Column(DateTime, server_default=func.now())
    achieved_at = Column(DateTime, onupdate=func.now())

    member = relationship("Member", back_populates="user_todos")
    todos = relationship("TODO", back_populates="user_todos")

# ----------------------------------------------------------------------------------------------------------------------
# AI CHAT LOGS
# ----------------------------------------------------------------------------------------------------------------------
class AIChatLog(Base):
    """
    AI 튜터와의 채팅 기록을 저장하는 테이블
    """
    __tablename__ = "ai_chat_logs"

    log_id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id", ondelete="CASCADE"))
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    member = relationship("Member", back_populates="ai_chat_logs")

# ----------------------------------------------------------------------------------------------------------------------
# STUDY PLANS
# ----------------------------------------------------------------------------------------------------------------------
class StudyPlan(Base):
    """
    AI가 생성해준 일일 학습 플래너 데이터
    """
    __tablename__ = "study_plans"

    plan_id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id", ondelete="CASCADE"))

    # target_date: 계획이 적용되는 날짜 (예: 2024-05-20) - 달력 조회용
    target_date = Column(Date, nullable=False)

    # raw_input: 사용자가 입력했던 요구사항 원문 (예: "수학 3시간 집중하고 싶어")
    original_prompt = Column(Text, nullable=True)

    # plan_data: LLM이 생성한 JSON 구조체 (PostgreSQL JSONB 타입 사용)
    # 예: {"schedule": [{"time": "09:00", "task": "Math", "type": "study"}, ...]}
    plan_data = Column(JSONB, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    member = relationship("Member", back_populates="study_plans")