from sqlalchemy import Column, BigInteger, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Member(Base):
    __tablename__ = "members"

    member_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    login_id = Column(String(50), unique=True)
    password = Column(String(255))
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    age = Column(Integer)
    pin_code = Column(Integer)
    social_type = Column(String(20))

    total_mileage = Column(Integer, default=0)
    saved_time_minute = Column(Integer, default=0)

    period_start_date = Column(DateTime)
    period_end_date = Column(DateTime)
    fixed_seat_id = Column(BigInteger)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    tokens = relationship("Token", back_populates="member")
    orders = relationship("Order", back_populates="member")


class Token(Base):
    __tablename__ = "tokens"

    token_id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id"))
    token = Column(String(200))
    expires_at = Column(DateTime)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("Member", back_populates="tokens")


class Product(Base):
    __tablename__ = "products"

    product_id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    price = Column(Integer, nullable=False)
    value = Column(Integer, nullable=False)
    is_exposured = Column(Boolean, default=True)


class Seat(Base):
    __tablename__ = "seats"

    seat_id = Column(BigInteger, primary_key=True, autoincrement=True)
    type = Column(String(10), nullable=False)
    status = Column(String(20), default="available")


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id"))
    product_id = Column(BigInteger, ForeignKey("products.product_id"))

    buyer_phone = Column(String(20))
    payment_amount = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("Member", back_populates="orders")
    product = relationship("Product")


class SeatUsage(Base):
    __tablename__ = "seat_usage"

    usage_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("orders.order_id"))
    seat_id = Column(BigInteger, ForeignKey("seats.seat_id"))
    member_id = Column(BigInteger, ForeignKey("members.member_id"))

    check_in_time = Column(DateTime, default=datetime.utcnow)
    check_out_time = Column(DateTime)
    ticket_expired_time = Column(DateTime)


class MileageHistory(Base):
    __tablename__ = "mileage_history"

    history_id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.member_id"))
    amount = Column(Integer, nullable=False)
    type = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)