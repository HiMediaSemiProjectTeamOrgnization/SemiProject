from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Product, Member, Order

router = APIRouter(prefix="/api/web", tags=["웹사이트 관리"])

# ===== 로그인 관련 =====
@router.get("/me")
def getMemberInfo(db: Session = Depends(get_db)):
    """로그인 상태확인 로직"""

    # 테스트를 위해 1번 계정 가져오는 코드로 구현 -> 통합 이후 JWT 토큰 검증으로 변경될 예정
    id = 1
    user = db.query(Member).filter(Member.member_id == id).filter(Member.is_deleted_at == False).first()

    return user

# ===== 이용권 관련 =====
@router.get("/tickets")
def getTicketList(db: Session = Depends(get_db)):
    """이용권 목록 조회로직"""

    # is_exposured 컬럼이 False인 데이터는 조회 X
    tickets = db.query(Product).filter(Product.is_exposured).all()

    return tickets

# ===== 결제 관련 =====
@router.post("/payments")
def getPaymentPage(ticket: dict, user: dict, db: Session = Depends(get_db)):
    """사용자가 이용권 선택 후 결제한 내역을 받아오는 로직"""

    phone = f"{user['phone1']}-{user['phone2']}-{user['phone3']}"
    
    chkMember = db.query(Member).filter(Member.name == user["name"]).filter(Member.phone == phone).first()

    if chkMember:
        member_id = chkMember.member_id
        buyer_phone = chkMember.phone
    else:
        member_id = 2
        buyer_phone = phone

    order = Order(
            member_id = member_id,
            product_id = ticket["product_id"],
            buyer_phone = phone,
            payment_amount = ticket["total_amount"]
        )
    
    db.add(order)
    db.commit()
    db.refresh(order)
