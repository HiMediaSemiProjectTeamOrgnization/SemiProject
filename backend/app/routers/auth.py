from fastapi import APIRouter, HTTPException, Form, Response, Cookie, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from passlib.context import CryptContext
from starlette.responses import JSONResponse
from app.database import get_db
from app.models import Token, Member
from app.schemas import TokenCreate
import os

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 30
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 7
REFRESH_TOKEN_EXPIRE_DAYS = 7

KST = ZoneInfo("Asia/Seoul")

BCRYPT = CryptContext(schemes=["bcrypt"], deprecated="auto")

""" 비밀번호 인코딩 """
def password_encode(password: str):
    return BCRYPT.hash(password)

""" 비밀번호 디코딩 """
def password_decode(password: str, hashed_password: str):
    return BCRYPT.verify(password, hashed_password)

""" 액세스 토큰 생성 """
def create_access_token(member_id, name):
    exp = datetime.now(KST) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "member_id": member_id,
        "name": name,
        "type": "access",
        "exp": exp
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token

""" 리프레시 토큰 생성 """
def create_refresh_token(member_id, name, db: Session):
    exp = datetime.now(KST) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "member_id": member_id,
        "name": name,
        "type": "refresh",
        "exp": exp
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    # 리프레시 토큰 DB 저장
    refresh_token = Token(
        member_id=member_id,
        token=token,
        expires_at=exp,
    )
    db.add(refresh_token)
    db.commit()

    return token

""" JWT 토큰 검증 """
def verify_token(db: Session, token: str, token_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        member_id = payload.get("member_id")
        name = payload.get("name")
        type_check = payload.get("type")

        # 사용할 member_id, name을 dict 자료형으로 보내기
        mem_info = {
            "member_id": member_id,
            "name": name
        }

        # 토큰 타입 검증
        if type_check != token_type:
            return None, "invalid"

        return mem_info, None

    except ExpiredSignatureError:
        return None, "expired"

    except JWTError:
        return None, "invalid"

""" JWT 토큰이 포함된 쿠키 정보 받기 """
def get_cookies_info(response: Response, access_token: str, refresh_token: str, db: Session):
    # 액세스 토큰이 없을때
    if not access_token:
        # 리프레시 토큰이 있을때
        if refresh_token:
            mem_info, error = verify_token(db, refresh_token, "refresh")

            # 리프레시 토큰이 만료되었을때
            if error == "expired":
                raise HTTPException(status_code=404, detail="expired refresh token")

            # 리프레시 토큰이 유효하지않을때
            if error == "invalid":
                raise HTTPException(status_code=404, detail="invalid refresh token")

            # 액세스 토큰 재발급
            response.set_cookie(
                key="access_token",
                value=create_access_token(mem_info["member_id"], mem_info["name"]),
                httponly=True,
                samesite="lax",
                max_age=ACCESS_TOKEN_EXPIRE_SECONDS
            )
            return mem_info

        # 리프레시 토큰이 없을때
        raise HTTPException(status_code=404, detail="invalid tokens")

    # 액세스 토큰이 있을때
    mem_info, error = verify_token(db, refresh_token, "access")

    # 액세스 토큰이 만료되었을때
    if error == "expired":
        raise HTTPException(status_code=404, detail="expired access token")

    # 액세스 토큰이 유효하지않을때
    if error == "invalid":
        raise HTTPException(status_code=404, detail="expired access token")

    return mem_info

""" 로그인 - Access Token + Refresh Token 발급 """
@router.post("/login")
def login(response: Response, login_id: str, email: str, password: str, db: Session = Depends(get_db)):
    member = None

    # 소셜 로그인 했을 때
    if email:
        member = db.query(Member).filter(Member.email == email).first()
        if not member:
            raise HTTPException(status_code=404, detail="email not found")

    # 일반 로그인 했을 때
    elif login_id:
        member = db.query(Member).filter(Member.login_id == login_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="id not found")

        # 비밀번호 검증
        if not password_decode(password, member.password):
            raise HTTPException(status_code=401, detail="password not found")

    else:
        raise HTTPException(status_code=400, detail="invalid member info")

    # 액세스 토큰 생성
    access_token = create_access_token(member.member_id, member.name)

    # 리프레시 토큰 생성
    refresh_token = create_refresh_token(member.member_id, member.name, db)

    # 토큰들을 쿠키에 저장
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_SECONDS
    )

    return {"msg": "success"}

""" 테스트용 페이지 """
@router.get("/test", response_class=HTMLResponse)
def get_profile(response: Response, access_token: str = Cookie(None), refresh_token: str = Cookie(None), db: Session = Depends(get_db)):
    mem_info = get_cookies_info(response, access_token, refresh_token, db)

    return f"""
    <html>
        <body>
            <h1>👤 내 프로필</h1>
            <h2>안녕하세요, {mem_info["name"]}님!</h2>
            <p><strong>Access Token:</strong> ✅ 유효 (1분)</p>
            <p><strong>Refresh Token:</strong> ✅ 유효 (7일)</p>

            <div>
                <form action="/logout" method="post" style="display: inline;">
                    <button type="submit">로그아웃</button>
                </form>
                <a href="/" style="margin-left: 10px;">홈으로</a>
            </div>
        </body>
    </html>
    """

"""로그아웃 - 모든 토큰 삭제"""
@router.delete("/logout")
def logout(response: Response, refresh_token: str = Cookie(None), db: Session = Depends(get_db)):
    # 서버에서 리프레시 토큰 제거
    token = db.query(Token).filter(Token.token == refresh_token).first()
    db.delete(token)
    db.commit()

    # 쿠키 삭제
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {"msg": "success"}

@router.get("/register")
def create_member(name: str, db: Session = Depends(get_db)):
    member = Member(
        name=name
    )
    db.add(member)
    db.commit()

    return {"msg": "success"}