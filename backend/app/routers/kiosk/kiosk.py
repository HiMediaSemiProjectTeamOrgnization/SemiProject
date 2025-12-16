# app/routers/kiosk/kiosk.py

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from models import Member, Product, Order, Seat, SeatUsage, MileageHistory, TODO, UserTODO
from schemas import PinAuthRequest
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import cast, Date, func, distinct
import requests
import time
import base64
import os

router = APIRouter(prefix="/api/kiosk")

# ------------------------
# [설정] AI 카메라 서버 설정
# ------------------------
CAMERA_SERVER = "http://localhost:12454"
CAPTURE_DIR = "captures/real"
os.makedirs(CAPTURE_DIR, exist_ok=True)

# ------------------------
# [Helper] 이미지 저장 함수
# ------------------------
def save_base64_image(image_base64: str, seat_id: int, usage_id: int):
    if not image_base64:
        return None
    
    times = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"seat{seat_id}_usage{usage_id}_{times}.jpg"
    file_path = os.path.join(CAPTURE_DIR, filename)

    try:
        image_bytes = base64.b64decode(image_base64)
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        # 웹에서 접근 가능한 경로로 반환 (예: /captures/real/...)
        return f"/{CAPTURE_DIR}/{filename}" 
    except Exception as e:
        print(f"[Error] Image save failed: {e}")
        return None

# ------------------------
# [Helper] AI 예측 요청 함수
# ------------------------
def capture_predict(seat_id: int, usage_id: int):
    """
    카메라 서버에 촬영 요청 -> 결과 폴링 -> 결과 반환
    Returns: (is_detected: bool, img_path: str, classes: list, msg: str)
    """
    try:
        # 1. 카메라 서버에 촬영 및 분석 요청
        res = requests.post(
            f"{CAMERA_SERVER}/camera/checkout",
            json={"seat_id": seat_id, "usage_id": usage_id},
            timeout=5
        )
        
        if res.status_code not in (200, 202):
            print(f"[Warning] Camera server error: {res.text}")
            return False, None, [], "Camera Error"

        job_id = res.json().get("job_id", usage_id)

        # 2. 결과 폴링 (최대 3초 대기)
        for _ in range(10):
            time.sleep(0.3)
            res_poll = requests.get(f"{CAMERA_SERVER}/camera/lost-item/result/{job_id}", timeout=2)
            
            if res_poll.status_code != 200:
                continue

            result_data = res_poll.json().get("result", {})
            
            if result_data.get("done") is True:
                items = result_data.get("items", [])
                image_b64 = result_data.get("image_base64")
                
                if items:
                    img_path = save_base64_image(image_b64, seat_id, usage_id)
                    return True, img_path, items, "Detected"
                else:
                    return False, None, [], "Clean"
        
        return False, None, [], "Timeout"

    except Exception as e:
        print(f"[Error] capture_predict failed: {e}")
        return False, None, [], str(e)


# ------------------------
# 전화번호 없이 비회원 조회 또는 생성 (member_id 2 고정)
# ------------------------
def get_or_create_guest(db: Session):
    guest = db.query(Member).filter(Member.member_id == 2).first()

    if guest:
        if guest.role != "guest":
            guest.role = "guest"
            db.add(guest)
            db.commit()
            db.refresh(guest)
        return guest

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

    # 3. 유효한 기간제 이용권 보유 여부 확인
    now = datetime.now()
    active_period = db.query(Order).join(Product).filter(
        Order.member_id == member.member_id,
        Order.period_end_date > now,
        Product.type == '기간제'
    ).first()

    return {
        "member_id": member.member_id,
        "name": member.name,
        "phone": member.phone,
        "saved_time_minute": member.saved_time_minute, 
        "total_mileage": member.total_mileage,
        "has_period_pass": True if active_period else False
    }

# ------------------------
# 2) 이용권 목록 조회
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
    use_mileage: int = Body(0),
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

    if member.saved_time_minute is None:
        member.saved_time_minute = 0
    if member.total_mileage is None:
        member.total_mileage = 0

    # -------------------------------------------------------
    # 마일리지 사용 로직
    # -------------------------------------------------------
    if use_mileage > 0:        
        if member.total_mileage < use_mileage:
            raise HTTPException(status_code=400, detail="보유 마일리지가 부족합니다.")
        
        if use_mileage > product.price:
            raise HTTPException(status_code=400, detail="상품 금액보다 많은 마일리지를 사용할 수 없습니다.")

        member.total_mileage -= use_mileage
        
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
        payment_amount=final_payment_amount,
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
        "used_mileage": use_mileage,
        "final_price": final_payment_amount
    }
    if member.role != "guest":
        response_data["saved_time_minute"] = member.saved_time_minute 
        response_data["total_mileage"] = member.total_mileage
        
    return response_data

# ------------------------
# 4) 좌석 목록 조회
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
            "near_window": s.near_window,
            "corner_seat": s.corner_seat,
            "aisle_seat": s.aisle_seat,
            "isolated": s.isolated,
            "near_beverage_table": s.near_beverage_table,
            "is_center": s.is_center,
            "is_status": s.is_status,
            "user_name": None,
            "remaining_time": None,
            "ticket_expired_time": None,
            "role": None
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
                    seat_data["role"] = member.role
                
                if active_usage.ticket_expired_time:
                    seat_data["ticket_expired_time"] = active_usage.ticket_expired_time
                    remain_delta = active_usage.ticket_expired_time - now
                    minutes = int(remain_delta.total_seconds() / 60)
                    seat_data["remaining_time"] = max(minutes, 0)
            else:
                seat_data["user_name"] = "점검중"
        
        results.append(seat_data)

    return results

# ------------------------
# 5) 입실
# ------------------------
@router.post("/check-in")
def check_in(
    phone: str = Body(...),
    seat_id: int = Body(...),
    order_id: Optional[int] = Body(None), 
    db: Session = Depends(get_db)
):
    member = db.query(Member).filter(Member.phone == phone).first()
    if not member:
        clean_phone = phone.replace("-", "")
        if clean_phone != phone:
            member = db.query(Member).filter(Member.phone == clean_phone).first()
    if not member:
        member = get_or_create_guest(db)
    
    member_id_to_use = member.member_id

    if member.role != "guest":
        active_usage = db.query(SeatUsage).filter(SeatUsage.member_id == member_id_to_use, SeatUsage.check_out_time == None).first()
        if active_usage:
            raise HTTPException(status_code=400, detail="이미 입실 중입니다.")

    seat = db.query(Seat).filter(Seat.seat_id == seat_id).first()
    if not seat: raise HTTPException(status_code=404, detail="좌석 정보 없음")
    if not seat.is_status: raise HTTPException(status_code=400, detail="이미 사용 중인 좌석")

    expired_time = None
    now = datetime.now()
    
    if member.role != "guest":
        if seat.type == "fix":
            active_period_order = db.query(Order).join(Product).filter(
                Order.member_id == member.member_id,
                Order.period_end_date > now,
                Product.type == '기간제'
            ).order_by(Order.period_end_date.desc()).first()

            if not active_period_order:
                raise HTTPException(status_code=400, detail="유효한 기간제 이용권이 없습니다.")
            expired_time = active_period_order.period_end_date
        else:
            if member.saved_time_minute <= 0:
                raise HTTPException(status_code=400, detail="시간제 이용권(잔여 시간)이 부족합니다.")
            expired_time = now + timedelta(minutes=member.saved_time_minute)
    else:
        if not order_id: raise HTTPException(status_code=400, detail="주문 정보 필요")
        order = db.query(Order).filter(Order.order_id == order_id).first()
        if not order: raise HTTPException(status_code=404, detail="주문 정보 없음")
        product = db.query(Product).filter(Product.product_id == order.product_id).first()
        ticket_duration_minutes = product.value * 60
        expired_time = now + timedelta(minutes=ticket_duration_minutes)
        order.period_start_date = now
        order.period_end_date = expired_time
        db.add(order)
        
    usage = SeatUsage(
        member_id=member_id_to_use,
        seat_id=seat_id,
        order_id=order_id,
        check_in_time=now,
        ticket_expired_time=expired_time
    )
    db.add(usage)
    
    seat.is_status = False
    db.add(seat)

    db.commit()
    db.refresh(usage)

    return {
        "usage_id": usage.usage_id,
        "check_in_time": usage.check_in_time,
        "seat_id": seat_id,  
        "ticket_expired_time": usage.ticket_expired_time
    }

# ------------------------
# 6) 퇴실 (AI YOLO 및 Todo 달성 체크)
# ------------------------
@router.post("/check-out")
def check_out(
    seat_id: int = Body(...),
    phone: Optional[str] = Body(None),
    pin: Optional[int] = Body(None),
    force: bool = Body(False), 
    db: Session = Depends(get_db)
):
    now = datetime.now()

    # 1. 좌석 정보 조회
    usage = db.query(SeatUsage).filter(
        SeatUsage.seat_id == seat_id,
        SeatUsage.check_out_time == None
    ).first()

    if not usage:
        raise HTTPException(status_code=404, detail="해당 좌석의 입실 기록을 찾을 수 없습니다.")

    # 2. 입실자 조회
    member = db.query(Member).filter(Member.member_id == usage.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="입실자 정보를 찾을 수 없습니다.")

    # 3. 본인 확인
    if member.role == "guest":
        if not phone: raise HTTPException(status_code=400, detail="비회원은 전화번호 입력이 필요합니다.")
        if not usage.order: raise HTTPException(status_code=400, detail="비회원 주문 정보를 찾을 수 없습니다.")
        input_phone = phone.replace("-", "")
        db_phone = usage.order.buyer_phone.replace("-", "") if usage.order.buyer_phone else ""
        if input_phone != db_phone: raise HTTPException(status_code=401, detail="전화번호가 일치하지 않습니다.")
    else:
        if not force:
            if pin is None: raise HTTPException(status_code=400, detail="회원은 PIN 번호 입력이 필요합니다.")
            if member.pin_code != pin: raise HTTPException(status_code=401, detail="PIN 번호가 일치하지 않습니다.")

    # 3-5. YOLO 감지
    if not force: 
        try:
            is_detected, img_path, classes, msg = capture_predict(seat_id, usage.usage_id)
            if is_detected:
                web_image_url = img_path.replace("\\", "/") if img_path else ""
                detected_items = ", ".join(classes)
                raise HTTPException(
                    status_code=400, 
                    detail={
                        "code": "DETECTED",
                        "message": f"좌석에 짐({detected_items})이 감지되었습니다.",
                        "image_url": web_image_url
                    }
                )
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            print(f"[Warning] YOLO Error: {e}")

    # 4. 시간 계산
    time_used = now - usage.check_in_time
    time_used_minutes = int(time_used.total_seconds() / 60)
    
    seat = db.query(Seat).filter(Seat.seat_id == seat_id).first()
    already_attended = False

    # 5. 정산 및 출석 체크
    if member.role != "guest":
        if time_used_minutes >= 0: 
            check_in_date = usage.check_in_time.date()
            existing_attendance = db.query(SeatUsage).filter(
                SeatUsage.member_id == member.member_id,
                cast(SeatUsage.check_in_time, Date) == check_in_date,
                SeatUsage.is_attended == True
            ).first()

            if not existing_attendance:
                usage.is_attended = True
            else:
                already_attended = True

        if seat and seat.type != "fix":
            member.saved_time_minute -= time_used_minutes
            if member.saved_time_minute < 0:
                member.saved_time_minute = 0 
    
    # 6. 퇴실 처리 (DB 업데이트)
    usage.check_out_time = now
    
    if seat:
        seat.is_status = True
        db.add(seat)

    db.add(usage)
    db.add(member)
    
    # [중요] Todo 계산을 위해 현재 usage 정보를 DB에 반영 (Commit 전 Flush)
    db.flush() 

    # ------------------------------------------------------------------
    # [NEW] 7. Todo 달성 여부 확인 및 처리
    # ------------------------------------------------------------------
    todo_results = []
    
    if member.role != "guest":
        # 진행 중인 Todo 조회
        active_todos = db.query(UserTODO).join(TODO).filter(
            UserTODO.member_id == member.member_id,
            UserTODO.is_achieved == False
        ).all()

        for user_todo in active_todos:
            todo_def = user_todo.todos
            is_cleared = False
            current_val = 0
            
            # (A) 목표 타입: 시간 (time) - 누적 학습 시간(분)
            if todo_def.todo_type == 'time':
                # 목표 시작일 이후의 총 이용 시간 합산 (현재 세션 포함)
                total_seconds = db.query(func.sum(
                    func.extract('epoch', SeatUsage.check_out_time - SeatUsage.check_in_time)
                )).filter(
                    SeatUsage.member_id == member.member_id,
                    SeatUsage.check_out_time != None,
                    SeatUsage.check_in_time >= user_todo.started_at
                ).scalar() or 0
                
                current_val = int(total_seconds / 60) # 분 단위 변환
                if current_val >= todo_def.todo_value:
                    is_cleared = True

            # (B) 목표 타입: 출석 (attendance) - 누적 출석 일수
            elif todo_def.todo_type == 'attendance':
                # 목표 시작일 이후 출석 인정된(is_attended=True) 날짜 수 (중복 제거)
                attend_count = db.query(func.count(distinct(cast(SeatUsage.check_in_time, Date)))).filter(
                    SeatUsage.member_id == member.member_id,
                    SeatUsage.is_attended == True,
                    SeatUsage.check_in_time >= user_todo.started_at
                ).scalar() or 0
                
                current_val = attend_count
                if current_val >= todo_def.todo_value:
                    is_cleared = True

            # (C) 달성 처리 및 보상 지급
            reward_amount = 0
            if is_cleared:
                user_todo.is_achieved = True
                user_todo.achieved_at = now
                
                # 보상 계산: 베팅금액 + (베팅금액 * 페이백%)
                payback_rate = 1 + (todo_def.payback_mileage_percent / 100.0)
                reward_amount = int(todo_def.betting_mileage * payback_rate)
                
                if reward_amount > 0:
                    member.total_mileage += reward_amount
                    db.add(MileageHistory(
                        member_id=member.member_id,
                        amount=reward_amount,
                        type="prize"
                    ))
            
            # 결과 리스트에 추가
            todo_results.append({
                "title": todo_def.todo_title,
                "type": todo_def.todo_type,
                "goal_value": todo_def.todo_value,
                "current_value": current_val,
                "is_achieved_now": is_cleared,
                "reward_amount": reward_amount
            })

    # 최종 커밋
    db.commit()
    db.refresh(usage)

    return {
        "usage_id": usage.usage_id,
        "seat_id": seat_id,
        "check_out_time": usage.check_out_time.isoformat(),
        "time_used_minutes": time_used_minutes,
        "remaining_time_minutes": member.saved_time_minute if member.role != "guest" else 0,
        "is_attended": usage.is_attended, 
        "already_attended": already_attended,
        "todo_results": todo_results
    }