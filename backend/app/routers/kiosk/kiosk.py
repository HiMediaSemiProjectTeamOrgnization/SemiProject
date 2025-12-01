# app/routers/kiosk/kiosk.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from models import Member, Product, Order, Seat, SeatUsage, MileageHistory # MileageHistory 추가
from schemas import PinAuthRequest # 추가
from datetime import datetime, timedelta # timedelta 추가
from typing import Optional

router = APIRouter(prefix="/api/kiosk")

# ------------------------
# 전화번호 없이 비회원 조회 또는 생성 (member_id 2 고정)
# ------------------------
def get_or_create_guest(db: Session):
    # SQL INSERT문으로 '비회원'이 들어갔다면 role이 default('user')일 수 있음
    # 따라서 member_id=2로만 조회 후, role을 보정하는 로직 추가
    guest = db.query(Member).filter(Member.member_id == 2).first()

    if guest:
        # SQL Insert로 들어간 데이터가 role='user'라면 'guest'로 수정
        if guest.role != "guest":
            guest.role = "guest"
            db.add(guest)
            db.commit()
            db.refresh(guest)
        return guest

    # 존재하지 않으면 새로 생성 (혹시 모를 상황 대비)
    new_guest = Member(
        member_id=2,          
        phone="",             
        social_type="",
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
# [NEW] 1-2) 회원 로그인 (수정: 기간제 보유 여부 반환)
# ------------------------
@router.post("/auth/member-login")
def member_login(data: PinAuthRequest, db: Session = Depends(get_db)):
    # 1. 회원 조회
    member = db.query(Member).filter(
        Member.phone == data.phone,
        Member.role != "guest"
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="등록된 회원 정보가 없습니다.")
    
    # 2. PIN 확인
    if member.pin_code != data.pin:
        raise HTTPException(status_code=401, detail="PIN 번호가 일치하지 않습니다.")

    # 3. [추가] 유효한 기간제 이용권 보유 여부 확인
    now = datetime.now()
    active_period = db.query(Order).join(Product).filter(
        Order.member_id == member.member_id,
        Order.period_end_date > now, # 만료되지 않은
        Product.type == '기간제'
    ).first()

    return {
        "member_id": member.member_id,
        "name": member.name,
        "phone": member.phone,
        "saved_time_minute": member.saved_time_minute, 
        "total_mileage": member.total_mileage,
        "has_period_pass": True if active_period else False # [추가] 기간제 보유 여부
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
# 3) 이용권 구매 (마일리지 사용 기능 추가)
# ------------------------
@router.post("/purchase")
def purchase_ticket(
    product_id: int = Body(...),    
    member_id: int = Body(...),     
    phone: str = Body(None),
    use_mileage: int = Body(0),     # [추가] 사용할 마일리지 (기본값 0)
    db: Session = Depends(get_db)
):
    # 1. 상품 조회
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="이용권이 존재하지 않습니다.")

    # 2. 회원 조회
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        if member_id == 2:
            member = get_or_create_guest(db)
        else:
             raise HTTPException(status_code=404, detail="회원 정보가 없습니다.")

    # 2-1. 비회원 전화번호 저장
    if member.role == "guest" and phone:
        member.phone = phone
        db.add(member)
        db.flush()

    # Null 방지
    if member.saved_time_minute is None:
        member.saved_time_minute = 0
    if member.total_mileage is None:
        member.total_mileage = 0

    # -------------------------------------------------------
    # [추가] 마일리지 사용 로직
    # -------------------------------------------------------
    if use_mileage > 0:
        # 비회원 사용 불가
        if member.role == "guest":
            raise HTTPException(status_code=400, detail="비회원은 마일리지를 사용할 수 없습니다.")
        
        # 보유량 체크
        if member.total_mileage < use_mileage:
            raise HTTPException(status_code=400, detail="보유 마일리지가 부족합니다.")
        
        # 결제 금액 초과 사용 체크
        if use_mileage > product.price:
            raise HTTPException(status_code=400, detail="상품 금액보다 많은 마일리지를 사용할 수 없습니다.")

        # 마일리지 차감
        member.total_mileage -= use_mileage
        
        # 사용 이력 기록
        use_history = MileageHistory(
            member_id=member.member_id,
            amount=use_mileage,
            type="use"
        )
        db.add(use_history)

    # -------------------------------------------------------
    # 최종 결제 금액 및 적립 계산
    # -------------------------------------------------------
    final_payment_amount = product.price - use_mileage

    if member.role != "guest":
        # 시간 적립
        if product.type == "시간제":
            member.saved_time_minute += product.value * 60

        # 마일리지 적립 (실 결제 금액 기준 10%)
        # 전액 마일리지 결제 시(final_payment_amount=0) 적립 없음
        earned_mileage = final_payment_amount // 10
        
        if earned_mileage > 0:
            member.total_mileage += earned_mileage
            earn_history = MileageHistory(
                member_id=member_id,
                amount=earned_mileage,
                type="earn",
            )
            db.add(earn_history)

        db.add(member)
        db.flush() 

    # 4. 주문 생성
    order = Order(
        member_id=member_id,
        product_id=product_id,
        buyer_phone=phone,
        payment_amount=final_payment_amount, # [수정] 실 결제 금액으로 저장
        created_at=datetime.now()
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # 5. 응답
    response_data = {
        "order_id": order.order_id,
        "product_name": product.name,
        "price": product.price,
        "used_mileage": use_mileage,            # [추가] 사용한 마일리지
        "final_price": final_payment_amount     # [추가] 최종 결제 금액
    }
    if member.role != "guest":
        response_data["saved_time_minute"] = member.saved_time_minute 
        response_data["total_mileage"] = member.total_mileage
        
    return response_data

# ------------------------
# 4) 좌석 목록 조회 (수정: role 정보 추가)
# ------------------------
@router.get("/seats")
def list_seats(db: Session = Depends(get_db)):
    seats = db.query(Seat).order_by(Seat.seat_id).all()
    
    results = []
    now = datetime.now()

    for s in seats:
        seat_type_str = "기간제" if s.type == "fix" else "자유석"

        seat_data = {
            "seat_id": s.seat_id,
            "type": seat_type_str, 
            "is_status": s.is_status,
            "user_name": None,
            "remaining_time": None,
            "role": None # [추가] 사용자 역할 (member/guest)
        }

        if not s.is_status:
            active_usage = db.query(SeatUsage).filter(
                SeatUsage.seat_id == s.seat_id,
                SeatUsage.check_out_time == None
            ).first()

            if active_usage:
                member = db.query(Member).filter(Member.member_id == active_usage.member_id).first()
                if member:
                    seat_data["user_name"] = member.name
                    seat_data["role"] = member.role # [추가] role 저장
                
                if active_usage.ticket_expired_time:
                    remain_delta = active_usage.ticket_expired_time - now
                    minutes = int(remain_delta.total_seconds() / 60)
                    seat_data["remaining_time"] = max(minutes, 0)
        
        results.append(seat_data)

    return results

# ------------------------
# 5) 입실 (수정됨: 회원은 주문 조회 없이 시간 차감)
# ------------------------
@router.post("/check-in")
def check_in(
    phone: str = Body(...),
    seat_id: int = Body(...),
    order_id: Optional[int] = Body(None), 
    db: Session = Depends(get_db)
):
    # 1. 회원 조회
    member = db.query(Member).filter(Member.phone == phone).first()
    if not member:
        clean_phone = phone.replace("-", "")
        if clean_phone != phone:
            member = db.query(Member).filter(Member.phone == clean_phone).first()

    if not member:
        member = get_or_create_guest(db)
        
    member_id_to_use = member.member_id

    # 1-1. 중복 입실 방지 (회원만)
    if member.role != "guest":
        active_usage = db.query(SeatUsage).filter(
            SeatUsage.member_id == member_id_to_use,
            SeatUsage.check_out_time == None
        ).first()

        if active_usage:
            raise HTTPException(
                status_code=400, 
                detail=f"이미 좌석({active_usage.seat_id}번)을 사용 중입니다.\n퇴실 후 다시 시도해주세요."
            )

    # 2. 좌석 조회
    seat = db.query(Seat).filter(Seat.seat_id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="좌석 정보가 없습니다.")
    
    if not seat.is_status:
        raise HTTPException(status_code=400, detail="이미 사용 중인 좌석입니다.")

    # 3. 시간 계산 및 유효성 검사
    expired_time = None
    now = datetime.now()
    
    # [CASE 1] 회원
    if member.role != "guest":
        if member.saved_time_minute <= 0:
            raise HTTPException(status_code=400, detail="잔여 이용권 시간이 없습니다.")
        
        expired_time = now + timedelta(minutes=member.saved_time_minute)

    # [CASE 2] 비회원
    else:
        if not order_id:
             raise HTTPException(status_code=400, detail="비회원은 주문 정보가 필요합니다.")

        order = db.query(Order).filter(Order.order_id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="주문 정보가 없습니다.")
            
        product = db.query(Product).filter(Product.product_id == order.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="상품 정보 없음")

        # [수정] product.value는 '시간' 단위이므로 60을 곱해 '분'으로 변환해야 함
        ticket_duration_minutes = product.value * 60
        expired_time = now + timedelta(minutes=ticket_duration_minutes)
        
        order.period_start_date = now
        order.period_end_date = expired_time
        db.add(order)
        
    # 4. SeatUsage 생성
    usage = SeatUsage(
        member_id=member_id_to_use,
        seat_id=seat_id,
        order_id=order_id,
        check_in_time=now,
        ticket_expired_time=expired_time
    )
    db.add(usage)
    
    # 5. 좌석 상태 변경
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
# 6) 퇴실 (수정: 회원 PIN / 비회원 Phone 인증 분기)
# ------------------------
@router.post("/check-out")
def check_out(
    seat_id: int = Body(...),
    phone: Optional[str] = Body(None), # 비회원용
    pin: Optional[int] = Body(None),   # 회원용
    db: Session = Depends(get_db)
):
    now = datetime.now()

    # 1. 좌석의 현재 입실 정보 조회
    usage = db.query(SeatUsage).filter(
        SeatUsage.seat_id == seat_id,
        SeatUsage.check_out_time == None
    ).first()

    if not usage:
        raise HTTPException(status_code=404, detail="해당 좌석의 입실 기록을 찾을 수 없습니다.")

    # 2. 입실자 정보 조회
    member = db.query(Member).filter(Member.member_id == usage.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="입실자 정보를 찾을 수 없습니다.")

    # 3. 본인 확인 (인증)
    if member.role == "guest":
        # [비회원] 전화번호 검증
        if not phone:
            raise HTTPException(status_code=400, detail="비회원은 전화번호 입력이 필요합니다.")
        
        if not usage.order:
             raise HTTPException(status_code=400, detail="비회원 주문 정보를 찾을 수 없습니다.")
        
        input_phone = phone.replace("-", "")
        db_phone = usage.order.buyer_phone.replace("-", "") if usage.order.buyer_phone else ""
        
        if input_phone != db_phone:
            raise HTTPException(status_code=401, detail="전화번호가 일치하지 않습니다.")
            
    else:
        # [회원] PIN 번호 검증
        if pin is None:
            raise HTTPException(status_code=400, detail="회원은 PIN 번호 입력이 필요합니다.")
            
        if member.pin_code != pin:
            raise HTTPException(status_code=401, detail="PIN 번호가 일치하지 않습니다.")

    # 4. 사용 시간 계산
    time_used = now - usage.check_in_time
    time_used_minutes = int(time_used.total_seconds() / 60)
    
    # [수정] 5. 회원 정산 (사용한 시간만큼 차감)
    if member.role != "guest":
        # 기존 로직(+= remaining)은 시간을 더해버리는 문제가 있었음 -> (-= time_used)로 수정
        member.saved_time_minute -= time_used_minutes

        # 잔여 시간이 0보다 작아지면 0으로 보정 (초과 사용 시)
        if member.saved_time_minute < 0:
            member.saved_time_minute = 0 
    
    # 6. 퇴실 처리 및 좌석 반납
    usage.check_out_time = now
    db.add(usage)

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