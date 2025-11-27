from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from models import Member, Product, Order, Seat, SeatUsage
from datetime import datetime

router = APIRouter(prefix="/api/kiosk")

# ------------------------
# 회원 PIN 로그인
# ------------------------
@router.post("/auth")
def pin_auth(
    phone: str = Body(...),
    pin_code: int = Body(...),
    db: Session = Depends(get_db)
):
    member = db.query(Member).filter(
        Member.phone == phone,
        Member.pin_code == pin_code
    ).first()

    if not member:
        raise HTTPException(status_code=401, detail="회원 인증 실패")

    return {"is_member": True, "member_id": member.member_id}

# ------------------------
# 비회원 "로그인" (전화번호 입력)
# ------------------------
@router.post("/guest-login")
def guest_login(
    phone: str = Body(...),
):
    # 비회원은 항상 member_id=1 사용
    return {"is_member": False, "member_id": 1, "phone": phone}

# ------------------------
# 이용권 목록 조회
# ------------------------
@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.is_exposured == True,
        Product.type == "시간제"  # 기간제 제외
    ).all()
    
    return [{
        "product_id": p.product_id,
        "name": p.name,
        "type": p.type,
        "price": p.price,
        "value": p.value
    } for p in products]

# ------------------------
# 이용권 구매
# ------------------------
@router.post("/purchase")
def purchase_ticket(
    member_id: int = Body(...),
    product_id: int = Body(...),
    buyer_phone: str = Body(None),
    db: Session = Depends(get_db)
):
    member = db.query(Member).filter(Member.member_id == member_id).first()
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="이용권이 존재하지 않습니다.")
    
    if not member:
        raise HTTPException(status_code=404, detail="회원이 존재하지 않습니다.")

    order = Order(
        member_id=member_id,
        product_id=product_id,
        buyer_phone=buyer_phone,
        payment_amount=product.price,
        created_at=datetime.now()
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {"order_id": order.order_id, "member_id": member_id, "product_name": product.name, "price": product.price}

# ------------------------
# 좌석 조회
# ------------------------
@router.get("/seats")
def list_seats(db: Session = Depends(get_db)):
    seats = db.query(Seat).all()
    return [{"seat_id": s.seat_id, "type": s.type, "is_status": s.is_status} for s in seats]

# ------------------------
# 좌석 선택 후 입실
# ------------------------
@router.post("/check-in")
def check_in(
    member_id: int = Body(...),
    seat_id: int = Body(...),
    order_id: int = Body(...),
    db: Session = Depends(get_db)
):
    seat = db.query(Seat).filter(Seat.seat_id == seat_id).first()
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not seat or not order:
        raise HTTPException(status_code=404, detail="좌석 또는 주문이 존재하지 않습니다.")

    usage = SeatUsage(
        member_id=member_id,
        seat_id=seat_id,
        order_id=order_id,
        check_in_time=datetime.now()
    )
    db.add(usage)
    db.commit()
    db.refresh(usage)

    return {"usage_id": usage.usage_id, "seat_id": seat_id, "member_id": member_id, "check_in_time": usage.check_in_time}

# ------------------------
# 퇴실 처리
# ------------------------
@router.post("/check-out")
def check_out(
    seat_id: int = Body(...),
    phone: str = Body(...),
    db: Session = Depends(get_db)
):
    # 회원인지 비회원인지 구분
    member = db.query(Member).filter(Member.phone == phone).first()
    if not member:
        raise HTTPException(status_code=404, detail="회원 정보가 존재하지 않습니다.")

    usage = db.query(SeatUsage).filter(
        SeatUsage.seat_id == seat_id,
        SeatUsage.member_id == member.member_id,
        SeatUsage.check_out_time == None
    ).first()

    if not usage:
        raise HTTPException(status_code=404, detail="입실 기록이 존재하지 않습니다.")

    usage.check_out_time = datetime.now()
    db.commit()
    db.refresh(usage)

    return {"usage_id": usage.usage_id, "seat_id": seat_id, "check_out_time": usage.check_out_time}
