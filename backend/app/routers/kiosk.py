from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from models import Member, Product, Order, Seat, SeatUsage
from schemas import PinAuthRequest # 추가
from datetime import datetime

router = APIRouter(prefix="/api/kiosk")

# ------------------------
# 전화번호 없이 비회원 조회 또는 생성 (member_id 1 고정)
# ------------------------
def get_or_create_guest(db: Session):
    guest = db.query(Member).filter(
        Member.member_id == 1,
        Member.social_type == "guest"
    ).first()
    if guest:
        return guest

    # 없으면 생성
    new_guest = Member(
        member_id=1,
        phone="",
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
# [NEW] 1-2) 회원 로그인 (전화번호 + PIN)
# ------------------------
@router.post("/auth/member-login")
def member_login(data: PinAuthRequest, db: Session = Depends(get_db)):
    
    # Member 모델에서 phone으로 조회
    member = db.query(Member).filter(
        Member.phone == data.phone,
        Member.role != "guest"
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="등록된 회원 정보가 없습니다.")
    
    # PIN은 Integer로 저장되어 있으므로 변환
    
    if member.pin_code != data.pin:
        raise HTTPException(status_code=401, detail="PIN 번호가 일치하지 않습니다.")

    return {
        "member_id": member.member_id,
        "name": member.name,
        "phone": member.phone,
    }

# ------------------------
# 2) 이용권 목록 조회 (변경 없음)
# ------------------------
@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.is_exposured == True,
        Product.type == "시간제"
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


@router.post("/purchase")
def purchase_ticket(
    product_id: int = Body(...),
    member_id: int = Body(...),
    phone: str = Body(None),
    db: Session = Depends(get_db)
):
    # 1. 상품 조회
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="이용권이 존재하지 않습니다.")

    # 2. 주문 생성
    order = Order(
        member_id=member_id,
        product_id=product_id,
        buyer_phone=phone,
        payment_amount=product.price,
        created_at=datetime.now()
    )
    db.add(order)

    member_obj = db.query(Member).filter(Member.member_id == member_id).first()

    if member_obj:
        # 이용권 시간을 시간 -> 분으로 변환 후 누적
        saved_minutes = product.value * 60  # product.value가 시간 단위라고 가정
        member_obj.saved_time_minute += saved_minutes

        # 마일리지 적립 (결제 금액의 10%)
        mileage_amount = int(product.price * 0.1)
        member_obj.total_mileage += mileage_amount

        db.commit()
        db.refresh(member_obj)
    else:
        mileage_amount = 0

    # 응답
    return {
        "order_id": order.order_id,
        "product_name": product.name,
        "price": product.price,
        "saved_time_minute": member_obj.saved_time_minute if member_obj else 0,
        "earned_mileage": mileage_amount
    }

# ------------------------
# 4) 좌석 목록 조회 (변경 없음)
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
    clean_phone = phone.replace("-", "")
    
    # 1. member_id 조회 (clean_phone으로 찾거나 default guest 사용)
    member = db.query(Member).filter(Member.phone == clean_phone).first()
    if not member:
        member = get_or_create_guest(db)
        
    member_id_to_use = member.member_id

    seat = db.query(Seat).filter(Seat.seat_id == seat_id).first()
    order = db.query(Order).filter(Order.order_id == order_id).first()

    if not seat or not order:
        raise HTTPException(status_code=404, detail="좌석 또는 주문 정보 없음")

    usage = SeatUsage(
        member_id=member_id_to_use,
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
    clean_phone = phone.replace("-", "")
    
    # 1. member_id 조회 (clean_phone으로 찾거나 default guest 사용)
    member = db.query(Member).filter(Member.phone == clean_phone).first()
    if not member:
        member = get_or_create_guest(db)
        
    member_id_to_use = member.member_id

    usage = db.query(SeatUsage).filter(
        SeatUsage.seat_id == seat_id,
        SeatUsage.member_id == member_id_to_use,
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