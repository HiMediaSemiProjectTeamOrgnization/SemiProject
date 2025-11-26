from fastapi import APIRouter, HTTPException, Response, Cookie, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Token, Member
from schemas import TokenCreate, MemberCreate, MemberResponse
from utils import auth_utils

router = APIRouter(prefix="/api/auth", tags=["Auth"])

""" 로그인 - 엑세스 토큰, 리프레시 토큰 발급 """
@router.post("/login")
def login(response: Response, member_data: MemberResponse, db: Session = Depends(get_db)):
    member = None

    # 소셜 로그인 했을 때
    if member_data.email:
        member = db.query(Member).filter(Member.email == member_data.email).first()
        # 존재하지 않는 이메일일때
        if not member:
            raise HTTPException(status_code=404, detail="email not found")

    # 일반 로그인 했을 때
    elif member_data.login_id:
        member = db.query(Member).filter(Member.login_id == member_data.login_id).first()
        # 비밀번호 검증
        if not member or not auth_utils.password_decode(member_data.password, member.password):
            raise HTTPException(status_code=401, detail="incorrect id or password")

    # 그외 문제 예외처리
    else:
        raise HTTPException(status_code=400, detail="missing credentials")

    # 액세스 토큰 생성
    access_token = auth_utils.create_access_token(member.member_id, member.name)

    # 리프레시 토큰 생성
    refresh_token = auth_utils.create_refresh_token(member.member_id, member.name, db)

    # 토큰들을 쿠키에 저장
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=auth_utils.ACCESS_TOKEN_EXPIRE_SECONDS
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=auth_utils.REFRESH_TOKEN_EXPIRE_SECONDS
    )

    return {"msg": "success", "member_name": member.name}

""" 로그아웃 - 모든 토큰 삭제 """
@router.post("/logout")
def logout(response: Response, refresh_token: str = Cookie(None), db: Session = Depends(get_db)):
    # 서버에 있는 리프레시 토큰 무효화
    if refresh_token:
        token = db.query(Token).filter(Token.token == refresh_token).first()
        if token:
            token.is_revoked = True

            db.commit()
            db.refresh(token)

    # 쿠키 삭제
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {"msg": "success"}

""" 임시 회원 가입 """
@router.post("/signup")
def create_member(member_data: MemberCreate, db: Session = Depends(get_db)):
    # 중복 유저 방지 로직
    existing_user = db.query(Member).filter(member_data.login_id == member_data.login_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="exists user")

    hashed_pw = auth_utils.password_encode(member_data.password)
    member = Member(
        login_id=member_data.login_id,
        name=member_data.name,
        password=hashed_pw
    )

    db.add(member)
    db.commit()

    return {"msg": "success"}

""" 테스트용 페이지 """
@router.get("/test", response_class=HTMLResponse)
def get_profile(member: dict = Depends(auth_utils.get_cookies_info)):
    return f"""
    <html>
        <body>
            <h1>👤 내 프로필</h1>
            <h2>안녕하세요, {member["name"]}님!</h2>
            <h2>당신의 member_id: {member["member_id"]}님!</h2>
        </body>
    </html>
    """