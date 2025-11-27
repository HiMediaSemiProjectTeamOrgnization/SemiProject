from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from models import Member, Product, Order, Seat, SeatUsage
from datetime import datetime

router = APIRouter(prefix="/api/kiosk/guest")

# ------------------------
# 전화번호로 비회원 조회 또는 생성
# ------------------------
# ------------------------
# 전화번호 없이 비회원 조회 또는 생성 (member_id 1 고정)
# ------------------------
def get_or_create_guest(db):
    # 이미 존재하는 guest 확인
    guest = db.query(Member).filter(
        Member.member_id == 1,
        Member.social_type == "guest"
    ).first()

    if guest:
        return guest

    # 없으면 새로 생성 (member_id 1 고정, phone 비움)
    new_guest = Member(
        member_id=1,          # ★ 고정
        phone="",             # ★ 빈 문자열
        social_type="guest",
        role="guest",
        name="비회원",
        total_mileage=0,
        saved_time_minute=0
    )
    db.add(new_guest)
    db.commit()
    db.refresh(new_guest)
    return new_guest


# ------------------------
# 1) 비회원 로그인
# ------------------------
@router.post("/login")
def guest_login(phone: str = Body(...), db: Session = Depends(get_db)):
    guest = get_or_create_guest(db, phone)
    return {
        "is_member": False,
        "member_id": guest.member_id,
        "phone": guest.phone
    }


# ------------------------
# 2) 이용권 목록 조회
# ------------------------
@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.is_exposured == True,
        Product.type == "time"
    ).all()
    return [
        {
            "product_id": p.product_id,
            "name": p.name,
            "type": p.type,
            "price": p.price,
            "value": p.value
        } for p in products
    ]


# ------------------------
# 3) 구매하기
# ------------------------
@router.post("/purchase")
def purchase_ticket(
    phone: str = Body(...),
    product_id: int = Body(...),
    db: Session = Depends(get_db)
):
    guest = get_or_create_guest(db, phone)

    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="이용권이 존재하지 않습니다.")

    order = Order(
        member_id=guest.member_id,
        product_id=product_id,
        buyer_phone=phone,
        payment_amount=product.price,
        created_at=datetime.now()
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "order_id": order.order_id,
        "member_id": guest.member_id,
        "product_name": product.name,
        "price": product.price
    }


# ------------------------
# 4) 좌석 목록 조회
# ------------------------
@router.get("/seats")
def list_seats(db: Session = Depends(get_db)):
    seats = db.query(Seat).all()
    return [
        {
            "seat_id": s.seat_id,
            "type": s.type,
            "is_status": s.is_status
        } for s in seats
    ]


# ------------------------
# 5) 입실
# ------------------------
@router.post("/check-in")
def check_in(
    phone: str = Body(...),
    seat_id: int = Body(...),
    order_id: int = Body(...),
    db: Session = Depends(get_db)
):
    guest = get_or_create_guest(db, phone)

    seat = db.query(Seat).filter(Seat.seat_id == seat_id).first()
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not seat or not order:
        raise HTTPException(status_code=404, detail="좌석 또는 주문 정보 없음")

    usage = SeatUsage(
        member_id=guest.member_id,
        seat_id=seat_id,
        order_id=order_id,
        check_in_time=datetime.now()
    )
    db.add(usage)
    db.commit()
    db.refresh(usage)

    return {
        "usage_id": usage.usage_id,
        "seat_id": seat_id,
        "check_in_time": usage.check_in_time
    }


# ------------------------
# 6) 퇴실
# ------------------------
@router.post("/check-out")
def check_out(
    phone: str = Body(...),
    seat_id: int = Body(...),
    db: Session = Depends(get_db)
):
    guest = get_or_create_guest(db, phone)

    usage = db.query(SeatUsage).filter(
        SeatUsage.seat_id == seat_id,
        SeatUsage.member_id == guest.member_id,
        SeatUsage.check_out_time == None
    ).first()

    if not usage:
        raise HTTPException(status_code=404, detail="입실 기록 없음")

    usage.check_out_time = datetime.now()
    db.commit()
    db.refresh(usage)

    return {
        "usage_id": usage.usage_id,
        "seat_id": seat_id,
        "check_out_time": usage.check_out_time
    }
