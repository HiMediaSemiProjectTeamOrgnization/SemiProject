from fastapi import APIRouter, Response, Depends, Cookie, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Member
from schemas import MemberLogin
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