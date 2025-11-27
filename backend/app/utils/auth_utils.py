import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi import HTTPException, Response, Cookie, Depends
from jose import jwt, JWTError, ExpiredSignatureError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
from models import Token, Member
from schemas import TokenCreate, MemberCreate

"""
# 쿠키 사용법
1. 라우터 매개 변수에 추가
member: dict = Depends(auth_utils.get_cookies_info)

2. dict이므로 다음과 같이 member_id, name 꺼내기
member["member_id"]
member["name"]
"""

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

ACCESS_TOKEN_EXPIRE_MINUTES = 30
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = 7
REFRESH_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * REFRESH_TOKEN_EXPIRE_DAYS

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
def get_cookies_info(
    response: Response,
    access_token: str = Cookie(None),
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    # 엑세스 토큰이 있을때
    if access_token:
        mem_info, error = verify_token(db, access_token, "access")

        if not error:
            return mem_info

    # 엑세스 토큰이 없거나 만료되었을때
    # 리프레시 토큰이 있을때
    if refresh_token:
        mem_info, error = verify_token(db, refresh_token, "refresh")

        # 리프레시 토큰이 만료되었을때
        if error == "expired":
            raise HTTPException(status_code=401, detail="expired refresh token")

        # 리프레시 토큰이 유효하지않을때
        if error == "invalid":
            raise HTTPException(status_code=401, detail="invalid refresh token")

        # DB에 있는 리프레시 토큰과 일치 여부 검증
        db_token = db.query(Token).filter((Token.token == refresh_token) & (Token.is_revoked == False)).first()
        if not db_token:
            raise HTTPException(status_code=401, detail="token not found in DB")

        # 액세스 토큰 재발급
        new_access_token = create_access_token(mem_info["member_id"], mem_info["name"])
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_SECONDS
        )
        return mem_info

    # 리프레시 토큰이 없을때
    raise HTTPException(status_code=401, detail="invalid tokens")