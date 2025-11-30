from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime, timedelta
from models import Product, Member, Order, Seat
from utils.auth_utils import get_cookies_info

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
def getPaymentPage(ticketData: dict, user: dict, db: Session = Depends(get_db)):
    """사용자가 이용권 선택 후 결제한 내역을 받아오는 로직"""

    ticket = ticketData
    phone = f"{user['phone1']}-{user['phone2']}-{user['phone3']}"
    
    chkMember = db.query(Member).filter(Member.name == user["name"]).filter(Member.phone == phone).first()
    guest = db.query(Member.member_id).filter(Member.name == "비회원").scalar()

    # now = datetime.now()

    # if ticket["type"] == "시간제":
    #     end_time = now + timedelta(hours=int(ticket["value"]))
    #     print(end_time)
    # else:
    #     end_time = now + timedelta(days=int(ticket["value"]))
    #     print(end_time)

    # formatted_start_time = now.strftime("%Y-%m-%d %H:%M")
    # formatted_end_time = end_time.strftime("%Y-%m-%d %H:%M")


    if chkMember:
        member_id = chkMember.member_id
        buyer_phone = chkMember.phone
    else:
        member_id = guest
        buyer_phone = phone


    order = Order(
            member_id = member_id,
            product_id = ticket["product_id"],
            buyer_phone = phone,
            total_price = ticket["total_amount"],
            payment_amount = ticket["total_amount"] - ticket["discount_amount"],
            # period_start_date = formatted_start_time,
            # period_end_date = formatted_end_time
        )
    
    # db.add(order)
    # db.commit()
    # db.refresh(order)

    # if order.member_id != guest: