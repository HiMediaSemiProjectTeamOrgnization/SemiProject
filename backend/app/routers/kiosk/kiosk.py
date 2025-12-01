# app/routers/kiosk/kiosk.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from models import Member, Product, Order, Seat, SeatUsage, MileageHistory # MileageHistory 추가
from schemas import PinAuthRequest # 추가
from datetime import datetime, timedelta # timedelta 추가

router = APIRouter(prefix="/api/kiosk")

# ------------------------
# 전화번호 없이 비회원 조회 또는 생성 (member_id 1 고정)
# ------------------------
def get_or_create_guest(db: Session):
    # 🚨 Primary Key 중복 오류(UniqueViolation) 방지를 위해,
    # member_id=1인 비회원 계정이 존재하는지 먼저 확인하는 과정은 필수입니다.
    guest = db.query(Member).filter(
        Member.member_id == 1,
        Member.social_type == "guest"
    ).first()

    if guest:
        # 이미 존재하면 기존 객체 반환
        return guest

    # 존재하지 않으면 member_id=1로 새로 생성
    new_guest = Member(
        member_id=1,          # ★ 고정 (비회원 전용)
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
        "saved_time_minute": member.saved_time_minute, # 잔여 시간 포함
        "total_mileage": member.total_mileage # 마일리지 포함
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

# ------------------------
# 3) 이용권 구매 (회원/비회원 시간 적립 및 주문 생성)
# ------------------------
@router.post("/purchase")
def purchase_ticket(
    product_id: int = Body(...),    # 프론트에서 선택한 이용권 ID
    member_id: int = Body(...),     # 회원이면 실제 member_id, 비회원이면 1
    phone: str = Body(None),        # 비회원이면 전화번호, 회원이면 None
    db: Session = Depends(get_db)
):
    # 1. 상품 조회
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="이용권이 존재하지 않습니다.")

    # 2. 회원 조회 (시간 적립을 위함)
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        if member_id != 1:
             raise HTTPException(status_code=404, detail="회원 정보가 없습니다.")
        member = get_or_create_guest(db)

    # 2-1. 비회원 전화번호 저장
    if member.role == "guest" and phone:
        # 전화번호 입력이 있으면 Guest 계정에 업데이트
        member.phone = phone
        db.add(member)
        db.flush()  # dirty check 강제

    if member.role != "guest":
        # Null 방지
        if member.saved_time_minute is None:
            member.saved_time_minute = 0
        if member.total_mileage is None:
            member.total_mileage = 0

        # 시간 적립
        if product.type == "시간제":
            member.saved_time_minute += product.value * 60

        # 마일리지 적립
        earned_mileage = product.price // 10
        if earned_mileage > 0:
            member.total_mileage += earned_mileage
            mileage_history = MileageHistory(
                member_id=member_id,
                amount=earned_mileage,
                type="earn",
            )
            db.add(mileage_history)

        db.add(member)
        db.flush()   # dirty check 강제

    # 4. 주문 생성
    order = Order(
        member_id=member_id,
        product_id=product_id,
        buyer_phone=phone,  # 주문에도 그대로 저장
        payment_amount=product.price,
        created_at=datetime.now()
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # 5. 결제 완료 응답
    response_data = {
        "order_id": order.order_id,
        "product_name": product.name,
        "price": product.price,
    }
    if member.role != "guest":
        # 회원의 현재 잔여 시간 및 마일리지 응답에 포함
        response_data["saved_time_minute"] = member.saved_time_minute 
        response_data["total_mileage"] = member.total_mileage
        
    return response_data



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
# 5) 입실 (시간 차감/만료 시간 설정)
# ------------------------
@router.post("/check-in")
def check_in(
    phone: str = Body(...),
    seat_id: int = Body(...),
    order_id: int = Body(...), # 비회원 구매 시 해당 order_id를 사용하여 시간 계산
    db: Session = Depends(get_db)
):
    clean_phone = phone.replace("-", "")
    now = datetime.now()
    
    # 1. member_id 조회 및 검증
    member = db.query(Member).filter(Member.phone == clean_phone).first()
    if not member:
        member = get_or_create_guest(db)
        
    member_id_to_use = member.member_id

    # 2. 좌석, 주문, 상품 조회
    seat = db.query(Seat).filter(Seat.seat_id == seat_id).first()
    order = db.query(Order).filter(Order.order_id == order_id).first()

    if not seat or not order:
        raise HTTPException(status_code=404, detail="좌석 또는 주문 정보 없음")
    
    product = db.query(Product).filter(Product.product_id == order.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="상품 정보 없음")

    # 3. 좌석 상태 및 중복 입실 확인
    if not seat.is_status:
        raise HTTPException(status_code=400, detail="이미 사용 중인 좌석입니다.")
    
    # 4. 시간 계산 및 시간 차감/사용
    ticket_duration_minutes = product.value
    expired_time = None

    if member.role != "guest":
        # 회원: saved_time_minute 사용 (전체 시간 사용을 만료 시간으로 설정)
        if member.saved_time_minute <= 0:
            raise HTTPException(status_code=400, detail="잔여 이용권 시간이 없습니다.")

        # 회원의 잔여 시간을 모두 사용한다고 가정하고 만료 시간을 설정
        expired_time = now + timedelta(minutes=member.saved_time_minute)
        
        # 참고: check_in 시점에 saved_time_minute를 0으로 만들고 check_out 시점에 정산하는 모델도 있으나,
        # 여기서는 잔여 시간은 그대로 두고, 만료 시간만 계산 (check_out 시점에 정확히 사용 시간만큼만 차감 후 환불)

    else:
        # 비회원: 구매한 티켓의 시간만 사용 (order_id에 연결된 product.value 사용)
        expired_time = now + timedelta(minutes=ticket_duration_minutes)
        
        # 주문(Order)에 사용 시작/종료 시간 기록
        order.period_start_date = now
        order.period_end_date = expired_time
        db.add(order)
        
    # 5. SeatUsage 생성
    usage = SeatUsage(
        member_id=member_id_to_use,
        seat_id=seat_id,
        order_id=order_id,
        check_in_time=now,
        ticket_expired_time=expired_time # 만료 시간 설정
    )
    db.add(usage)
    
    # 6. 좌석 상태 변경
    seat.is_status = False
    db.add(seat)

    db.commit()
    db.refresh(usage)

    return {
        "usage_id": usage.usage_id,
        "seat_id": seat_id,
        "check_in_time": usage.check_in_time.isoformat(),
        "ticket_expired_time": usage.ticket_expired_time.isoformat() if usage.ticket_expired_time else None
    }


# ------------------------
# 6) 퇴실 (사용 시간 정산 및 좌석 상태 변경)
# ------------------------
@router.post("/check-out")
def check_out(
    phone: str = Body(...),
    seat_id: int = Body(...),
    db: Session = Depends(get_db)
):
    clean_phone = phone.replace("-", "")
    now = datetime.now()
    
    # 1. member_id 조회 및 검증
    member = db.query(Member).filter(Member.phone == clean_phone).first()
    if not member:
        member = get_or_create_guest(db)
        
    member_id_to_use = member.member_id

    # 2. 사용 중인 SeatUsage 기록 조회
    usage = db.query(SeatUsage).filter(
        SeatUsage.seat_id == seat_id,
        SeatUsage.member_id == member_id_to_use,
        SeatUsage.check_out_time == None
    ).first()

    if not usage:
        raise HTTPException(status_code=404, detail="입실 기록 없음")
        
    # 3. 사용 시간 계산
    time_used = now - usage.check_in_time
    time_used_minutes = int(time_used.total_seconds() / 60)
    
    # 4. 회원 정산 (시간 환불)
    if member.role != "guest":
        # check_in 시점의 총 사용 가능 시간 (Expired - CheckIn) 계산
        # ticket_expired_time은 check-in 시점의 member.saved_time_minute을 반영함.
        if usage.ticket_expired_time and usage.check_in_time:
            total_time_at_checkin = int((usage.ticket_expired_time - usage.check_in_time).total_seconds() / 60)
            
            # 남은 시간 = check_in 시점 총 시간 - 실제 사용 시간
            remaining_time_minutes = total_time_at_checkin - time_used_minutes

            if remaining_time_minutes > 0:
                member.saved_time_minute += remaining_time_minutes
                db.add(member)
            # 만약 사용 시간이 전체 시간을 초과하면 (만료 시간 이후 퇴실), saved_time_minute는 음수가 되지 않도록 함. (0으로 처리)
            elif member.saved_time_minute < 0:
                 member.saved_time_minute = 0 
    
    # 5. SeatUsage 업데이트
    usage.check_out_time = now
    db.add(usage)

    # 6. Seat 상태 변경
    seat = db.query(Seat).filter(Seat.seat_id == seat_id).first()
    if seat:
        seat.is_status = True
        db.add(seat)

    db.commit()
    db.refresh(usage)

    return {
        "usage_id": usage.usage_id,
        "seat_id": seat_id,
        "check_out_time": usage.check_out_time.isoformat(),
        "time_used_minutes": time_used_minutes,
        "remaining_time_minutes": member.saved_time_minute if member.role != "guest" else 0
    }