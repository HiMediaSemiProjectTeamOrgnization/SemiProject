from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Body
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime, timedelta
from models import Product, Member, Order, Seat, MileageHistory
from utils.auth_utils import get_cookies_info
from typing import Optional

router = APIRouter(prefix="/api/web", tags=["웹사이트 관리"])

# ===== 로그인 사용자 정보 가져오기 =====
@router.get("/me")
def getMemberInfo(token = Depends(get_cookies_info), db: Session = Depends(get_db)):
    """로그인한 사용자 정보 가져오는 로직"""
    
    id = token["member_id"]
    result = db.query(Member).filter(Member.member_id == id).filter(Member.is_deleted_at == False).first()

    user = {
        "email" : result.email,
        "phone" : result.phone,
        "name" : result.name,
        "total_mileage" : result.total_mileage
    }

    return user

# ===== 좌석 관련 =====
# 좌석현황 조회
@router.get("/seat")
def getSeatStatus(db: Session = Depends(get_db)):
    """좌석현황 조회"""
    seat = db.query(Seat).order_by(Seat.seat_id).all()

    return seat

# 좌석별 종료시간 조회
@router.get("/seat/endtime/{id}")
def getSeatEndTime(id: int, db: Session = Depends(get_db)):
    """좌석별 종료시간 안내함수"""
    now = datetime.now()

    result = db.query(Order).filter(Order.seat_id == id, Order.period_end_date > now).first()

    if not result: 
        return {"end_time" : None}

    return {"end_time" : result.period_end_date}

# ===== 이용권 관련 =====
@router.get("/tickets")
def getTicketList(db: Session = Depends(get_db)):
    """이용권 목록 조회로직"""

    # is_exposured 컬럼이 False인 데이터는 조회 X
    tickets = db.query(Product).filter(Product.is_exposured).all()

    return tickets

# ===== 결제 관련 =====
@router.post("/payments")
def getPaymentPage(ticketData: dict = Body(...), user: dict = Body(...), SelectSeat: Optional[dict] = Body(None), db: Session = Depends(get_db)):
    """사용자가 이용권 선택 후 결제내역 받아오는 로직"""

    ticket = ticketData
    phone = f"{user['phone1']}-{user['phone2']}-{user['phone3']}"
    useMileage = ticket["price"] - ticket["total_amount"]
    member = db.query(Member).filter(Member.name == user["name"]).filter(Member.phone == phone).first()

    order = Order(
            member_id = member.member_id,
            product_id = ticket["product_id"],
            buyer_phone = phone,
            payment_amount = ticket["total_amount"]
        )
    
    # 기간제 이용권일 때만 좌석 + 날짜 정보 추가
    if SelectSeat is not None:
        now = datetime.now()
        order.period_start_date = now
        order.period_end_date = now + timedelta(days=ticket["value"])
        order.fixed_seat_id = SelectSeat["seat_id"]

        # 좌석 사용불가 처리
        seat = db.query(Seat).filter(Seat.seat_id == order.fixed_seat_id).first()
        seat.is_status = False
        db.add(seat)
    
    db.add(order)
    db.flush()

    # 마일리지 사용했을 경우
    if useMileage > 0:
        db.add(MileageHistory(
            member_id = order.member_id,
            amount = useMileage,
            type = "use"
        ))
        # 사용자의 총 마일리지에서 사용한 만큼 차감
        member.total_mileage -= useMileage

    # 마일리지 적립 (적립률 1%)
    if order.payment_amount > 0:
        earnPoint = int(order.payment_amount * 0.01)
        db.add(MileageHistory(
                member_id = order.member_id,
                amount = earnPoint,
                type = "earn"
            ))
        # 사용자의 총 마일리지에서 적립된 마일리지 추가
        member.total_mileage += earnPoint

    db.commit()
    db.refresh(order)

    return {"status" : 200, "order" : order}
