from fastapi import APIRouter, Response, Depends, Cookie, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, distinct, or_
from typing import List
from datetime import datetime

from database import get_db
from models import Member, Order, Product, SeatUsage, TODO, UserTODO
from schemas import (
    MemberLogin, DailySalesStat, TodoCreate, TodoUpdate, TodoResponse, 
    MemberAdminResponse, MemberUpdatePhone,
    ProductCreate, ProductUpdate, ProductResponse
)
from utils.auth_utils import revoke_existing_token, revoke_existing_token_by_id, password_decode, set_token_cookies

router = APIRouter(prefix="/api/admin", tags=["Admin"])

""" 관리자 전용 로그인 (Member ID 1번 고정) """
@router.post("/login")
def admin_login(
    response: Response,
    member_data: MemberLogin,
    db: Session = Depends(get_db),
    refresh_token: str = Cookie(None)
):
    revoke_existing_token(db, refresh_token)

    member = db.query(Member).filter(Member.login_id == member_data.login_id).first()

    if not member or not password_decode(member_data.password, member.password):
        raise HTTPException(status_code=400, detail="incorrect id or password")

    if member.member_id != 1:
        raise HTTPException(status_code=403, detail="Not authorized (Admin only)")

    revoke_existing_token_by_id(db, member.member_id)
    set_token_cookies(member.member_id, member.name, db, response)

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "로그아웃 되었습니다."}

"""
[GET] 월별 일간 매출 통계 조회
Query Parameter: year (YYYY), month (MM)
"""
@router.get("/stats/daily", response_model=List[DailySalesStat])
def get_daily_sales_stats(
    year: int = Query(..., description="조회할 연도"),
    month: int = Query(..., description="조회할 월"),
    db: Session = Depends(get_db)
):
    # PostgreSQL의 to_char 함수를 사용하여 날짜 포맷팅 (YYYY-MM-DD)
    date_col = func.to_char(Order.created_at, 'YYYY-MM-DD').label("date")

    stats = (
        db.query(
            date_col,
            Product.type.label("product_type"),
            func.sum(Order.payment_amount).label("total_sales"),
            func.count(Order.order_id).label("order_count")
        )
        .join(Product, Order.product_id == Product.product_id)
        .filter(
            extract('year', Order.created_at) == year,
            extract('month', Order.created_at) == month
        )
        .group_by(date_col, Product.type)
        .order_by(date_col)
        .all()
    )

    return stats

@router.get("/stats/members")
def get_member_stats(db: Session = Depends(get_db)):
    now = datetime.now()
    
    # 1. 누적 회원 수 (삭제되지 않은 회원)
    # [조건] 관리자(1)와 비회원(2) 모두 제외
    total_members = db.query(Member).filter(
        Member.is_deleted_at == False,
        Member.member_id.notin_([1, 2])
    ).count()
    
    # 2. 신규 가입자 수 (이번 달 가입 기준)
    # [조건] 관리자(1)만 제외 (비회원 2번도 데이터가 있다면 포함)
    new_members = db.query(Member).filter(
        extract('year', Member.created_at) == now.year,
        extract('month', Member.created_at) == now.month,
        Member.is_deleted_at == False,
        Member.member_id != 1
    ).count()
    
    # 3. 기간제 회원 수 (현재 유효한 '기간권' 구매자)
    period_members = db.query(distinct(Order.member_id))\
        .join(Product, Order.product_id == Product.product_id)\
        .filter(
            Order.period_end_date > now,    # 기간이 만료되지 않음
            Product.type == '기간제',       # 상품 타입이 '기간권'
            Order.member_id != 1            # 관리자 제외
        ).count()

    # 4. 시간제 회원 수 (잔여 시간이 있고 '시간권' 구매 이력이 있는 회원)
    time_members = db.query(distinct(Member.member_id))\
        .join(Order, Member.member_id == Order.member_id)\
        .join(Product, Order.product_id == Product.product_id)\
        .filter(
            Member.saved_time_minute > 0,   # 잔여 시간이 있음
            Product.type == '시간제',        
            Member.is_deleted_at == False,
            Member.member_id != 1           # 관리자 제외
        ).count()
    
    # 5. 현재 이용 중인 회원 수
    # [조건] 관리자(1)만 제외 (비회원 2번이 이용 중이면 포함)
    current_users = db.query(SeatUsage).filter(
        SeatUsage.check_out_time == None,
        SeatUsage.member_id != 1
    ).count()

    # 6. 비회원 이용자 수 (이번 달 주문 기준, member_id가 2인 경우)
    # [조건] member_id == 2인 주문들의 구매자 전화번호(buyer_phone) 중복 제거 카운트
    non_members = db.query(distinct(Order.buyer_phone)).filter(
        Order.member_id == 2,
        extract('year', Order.created_at) == now.year,
        extract('month', Order.created_at) == now.month
    ).count()
    
    return {
        "total_members": total_members,
        "new_members": new_members,
        "period_members": period_members,
        "time_members": time_members,
        "current_users": current_users,
        "non_members": non_members
    }

@router.get("/stats/seats")
def get_seat_stats(db: Session = Depends(get_db)):
    """
    [GET] 구역별 실시간 좌석 점유 현황 조회
    """
    # 1. 현재 사용 중인 좌석 ID 목록 조회 (퇴실하지 않은 기록)
    occupied_seat_ids = db.query(SeatUsage.seat_id).filter(
        SeatUsage.check_out_time == None
    ).all()
    # set으로 변환하여 검색 속도 향상
    occupied_ids = {row[0] for row in occupied_seat_ids}

    # 2. 구역 정의 (제공된 SQL 기준)
    zones = [
        {"name": "고정석 (Private)", "range": range(1, 21)},      # 1~20
        {"name": "창가석 (View)", "range": range(21, 31)},       # 21~30
        {"name": "중앙석 (Island)", "range": range(31, 51)},     # 31~50
        {"name": "독립석 (Corner)", "range": range(51, 61)},     # 51~60
        {"name": "그룹석 (Group)", "range": range(61, 71)},      # 61~70
        {"name": "음료대석 (Easy)", "range": range(71, 91)},     # 71~90
        {"name": "일반석 (Aisle)", "range": range(91, 101)},     # 91~100
    ]

    stats = []
    total_used = 0
    total_count = 0

    for zone in zones:
        # 해당 구역의 총 좌석 수 (범위 내의 ID 개수)
        zone_total = len(zone["range"])
        
        # 해당 구역의 사용 중인 좌석 수
        zone_used = sum(1 for seat_id in zone["range"] if seat_id in occupied_ids)
        
        stats.append({
            "name": zone["name"],
            "total": zone_total,
            "used": zone_used,
            "rate": round((zone_used / zone_total) * 100) if zone_total > 0 else 0
        })
        
        total_used += zone_used
        total_count += zone_total

    return {
        "total": total_count,
        "used": total_used,
        "remain": total_count - total_used,
        "usage_rate": round((total_used / total_count) * 100) if total_count > 0 else 0,
        "zones": stats
    }

# [GET] Todo 목록 조회 (참가자 수 포함)
@router.get("/todos", response_model=List[TodoResponse])
def get_all_todos(db: Session = Depends(get_db)):
    """ 
    전체 TODO 목록 조회 
    - UserTODO 테이블과 조인하여 현재 참가 중인 인원 수(participant_count)를 함께 반환
    - 참가자가 없으면 0으로 계산됨
    """
    results = db.query(TODO, func.count(UserTODO.user_todo_id).label("participant_count"))\
        .outerjoin(UserTODO, TODO.todo_id == UserTODO.todo_id)\
        .group_by(TODO.todo_id)\
        .order_by(TODO.created_at.desc())\
        .all()
    
    response = []
    for todo, count in results:
        todo_dict = {
            "todo_id": todo.todo_id,
            "todo_type": todo.todo_type,
            "todo_title": todo.todo_title,
            "todo_content": todo.todo_content,
            "todo_value": todo.todo_value,
            "betting_mileage": todo.betting_mileage,
            "payback_mileage_percent": todo.payback_mileage_percent,
            "is_exposed": todo.is_exposed,
            "created_at": todo.created_at,
            "updated_at": todo.updated_at,
            "participant_count": count or 0
        }
        response.append(todo_dict)
    
    return response

@router.post("/todos", response_model=TodoResponse)
def create_todo(todo_data: TodoCreate, db: Session = Depends(get_db)):
    """ TODO 생성 """
    new_todo = TODO(
        todo_type=todo_data.todo_type,
        todo_title=todo_data.todo_title,
        todo_content=todo_data.todo_content,
        todo_value=todo_data.todo_value,
        betting_mileage=todo_data.betting_mileage,
        payback_mileage_percent=todo_data.payback_mileage_percent,
        is_exposed=todo_data.is_exposed
    )
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo

@router.put("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, todo_data: TodoUpdate, db: Session = Depends(get_db)):
    """ TODO 수정 """
    todo = db.query(TODO).filter(TODO.todo_id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # 전달받은 필드만 업데이트
    update_data = todo_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo, key, value)
    
    db.commit()
    db.refresh(todo)
    return todo

@router.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    """ TODO 삭제 """
    todo = db.query(TODO).filter(TODO.todo_id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    db.delete(todo)
    db.commit()
    return None

@router.get("/members", response_model=List[MemberAdminResponse])
def get_members(
    search: str = Query(None, description="이름/전화번호 검색"),
    db: Session = Depends(get_db)
):
    """ 관리자용 회원 목록 조회 (관리자/비회원 제외) + 상세 정보 포함 """
    
    # 1. 회원별 총 이용 시간 계산
    usage_subquery = (
        db.query(
            SeatUsage.member_id,
            func.sum(
                func.extract('epoch', SeatUsage.check_out_time - SeatUsage.check_in_time) / 60
            ).label("total_usage_minutes")
        )
        .filter(SeatUsage.check_out_time != None)
        .group_by(SeatUsage.member_id)
        .subquery()
    )

    # 2. 회원별 진행 중인 Todo 개수 계산 (Subquery)
    # is_achieved가 False인(아직 달성하지 못한) Todo만 카운트
    todo_count_subquery = (
        db.query(
            UserTODO.member_id,
            func.count(UserTODO.user_todo_id).label("active_todo_count")
        )
        .filter(UserTODO.is_achieved == False) 
        .group_by(UserTODO.member_id)
        .subquery()
    )

    # 3. 메인 쿼리에 조인 추가
    query = (
        db.query(
            Member, 
            func.coalesce(usage_subquery.c.total_usage_minutes, 0).label("total_usage_minutes"),
            func.coalesce(todo_count_subquery.c.active_todo_count, 0).label("active_todo_count") # <--- [추가]
        )
        .outerjoin(usage_subquery, Member.member_id == usage_subquery.c.member_id)
        .outerjoin(todo_count_subquery, Member.member_id == todo_count_subquery.c.member_id) # <--- [추가]
        .filter(Member.member_id.notin_([1, 2]))
    )

    # 4. 검색 필터 적용
    if search:
        clean_search = search.replace("-", "")

        query = query.filter(
            or_(
                Member.name.like(f"%{search}%"),
                Member.login_id.like(f"%{search}%"),
                func.replace(Member.phone, '-', '').like(f"%{clean_search}%")
            )
        )
    
    # 5. 조회 및 데이터 매핑
    results = query.order_by(Member.created_at.desc()).all()
    
    response = []
    for member, usage_min, todo_count in results:
        response.append(MemberAdminResponse(
            member_id=member.member_id,
            name=member.name,
            login_id=member.login_id,
            phone=member.phone,
            email=member.email,
            saved_time_minute=member.saved_time_minute,
            total_mileage=member.total_mileage,
            created_at=member.created_at,
            is_deleted_at=member.is_deleted_at,
            total_usage_minutes=int(usage_min) if usage_min else 0,
            active_todo_count=int(todo_count) if todo_count else 0
        ))
        
    return response

@router.put("/members/{member_id}/phone")
def update_member_phone(
    member_id: int, 
    req: MemberUpdatePhone, 
    db: Session = Depends(get_db)
):
    """ 회원 전화번호 수정 """
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="회원을 찾을 수 없습니다.")
    
    # 전화번호 중복 체크 (다른 회원이 이미 사용 중인지)
    if req.phone:
        exists = db.query(Member).filter(
            Member.phone == req.phone, 
            Member.member_id != member_id
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail="이미 존재하는 전화번호입니다.")

    member.phone = req.phone
    db.commit()
    
    return {"message": "전화번호가 수정되었습니다."}

@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    """ 전체 이용권 상품 조회 (관리자용) """
    return db.query(Product).order_by(Product.product_id).all()

@router.post("/products", response_model=ProductResponse)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    """ 이용권 상품 생성 """
    new_product = Product(
        name=product_data.name,
        type=product_data.type,
        price=product_data.price,
        value=product_data.value,
        is_exposured=product_data.is_exposured
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_data: ProductUpdate, db: Session = Depends(get_db)):
    """ 이용권 상품 수정 (가격, 노출 여부 등) """
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # 전달받은 필드만 업데이트
    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """ 이용권 상품 삭제 """
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return None