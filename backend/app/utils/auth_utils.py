import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
from fastapi import HTTPException, Response, Cookie, Depends
from jose import jwt, JWTError, ExpiredSignatureError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
from models import Token, Member

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 15
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

""" 엑세스 토큰 생성 """
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
def verify_token(token: str, token_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        member_id = payload.get("member_id")
        name = payload.get("name")
        type_check = payload.get("type")

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
        mem_info, error = verify_token(access_token, "access")

        if not error:
            return mem_info

    # 엑세스 토큰이 없거나 만료되었을때
    # 리프레시 토큰이 있을때
    if refresh_token:
        mem_info, error = verify_token(refresh_token, "refresh")

        # 리프레시 토큰이 만료되었을때
        if error == "expired":
            return None

        # 리프레시 토큰이 유효하지않을때
        if error == "invalid":
            return None

        # DB에 있는 리프레시 토큰과 일치 여부 검증
        db_token = db.query(Token).filter((Token.token == refresh_token) & (Token.is_revoked == False)).first()
        if not db_token:
            return None

        # 엑세스 토큰 재발급
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
    return None

""" 기존 리프레시 토큰 무효화 (쿠키 기반) """
def revoke_existing_token(db: Session, refresh_token: str = None):
    if refresh_token:
        token = db.query(Token).filter(Token.token == refresh_token).first()
        if token:
            token.is_revoked = True
            db.commit()
            db.refresh(token)

""" 기존 리프레시 토큰 무효화 (id 기반) """
def revoke_existing_token_by_id(db: Session, member_id: int):
    prev_refresh = db.query(Token).filter(Token.member_id == member_id).all()
    if prev_refresh:
        for refresh in prev_refresh:
            refresh.is_revoked = True
        db.commit()

""" 토큰 및 쿠키 생성 함수 """
def set_token_cookies(member_id: int, name: str, db: Session, response: Response):
    # 엑세스 토큰 생성
    access_token = create_access_token(member_id, name)

    # 리프레시 토큰 생성
    refresh_token = create_refresh_token(member_id, name, db)

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

    return response

""" 회원가입용 임시 토큰 생성 """
def encode_temp_signup_token(data: dict):
    exp = datetime.now(KST) + timedelta(minutes=5)

    payload = {
        **data,
        "type": "temp_signup",
        "exp": exp
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token

""" 회원가입용 임시 토큰 해독 """
def decode_temp_signup_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "temp_signup":
            raise HTTPException(status_code=401, detail="invalid token")

        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="invalid token")

""" 구글 추가정보 입력 페이지 검증 토큰 생성 """
def encode_google_temp_token():
    exp = datetime.now(KST) + timedelta(minutes=5)

    payload = {
        "type": "temp_google_check",
        "exp": exp,
        "check": "check"
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token

""" 구글 추가정보 입력 페이지 검증 토큰 해독 """
def decode_google_temp_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "temp_google_check":
            raise HTTPException(status_code=401, detail="invalid token")

        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="invalid token")