from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Product, Member, Order
from utils.auth_utils import get_cookies_info

router = APIRouter(prefix="/api/web", tags=["웹사이트 관리"])

# ===== 로그인 사용자 정보 가져오기 =====
@router.get("/me")
def getMemberInfo(res: Response, access_token: str = Cookie(None), refresh_token: str = Cookie(None), db: Session = Depends(get_db)):
    """로그인한 사용자 정보 가져오는 로직"""

    # 추후 성현님 코드 수정본보고 수정 필요
    token = get_cookies_info(res, access_token, refresh_token)
    id = token["member_id"]
    result = db.query(Member).filter(Member.member_id == id).filter(Member.is_deleted_at == False).first()

    user = {
        "email" : result.email,
        "phone" : result.phone,
        "name" : result.name,
        "total_mileage" : result.total_mileage
    }

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
