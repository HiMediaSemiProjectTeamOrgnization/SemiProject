import os
import random
import string
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
from fastapi import HTTPException, Response, Cookie, Depends
from jose import jwt, JWTError, ExpiredSignatureError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import SecretStr
from database import get_db
from models import Token, Member

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
MAIL_USERNAME=os.getenv("MAIL_USERNAME")
MAIL_PASSWORD=os.getenv("MAIL_PASSWORD")
MAIL_FROM=os.getenv("MAIL_FROM")
ACCESS_TOKEN_EXPIRE_MINUTES = 15
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = 7
REFRESH_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * REFRESH_TOKEN_EXPIRE_DAYS
KST = ZoneInfo("Asia/Seoul")
BCRYPT = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 이메일 설정 (Gmail 앱 비밀번호 사용)
conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=SecretStr(MAIL_PASSWORD),
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)
fast_mail = FastMail(conf)

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

""" 랜덤 인증번호 생성 """
def generate_random_code(length=6):
    return ''.join(random.choices(string.digits, k=length))

""" 랜덤 비밀번호 생성 """
def generate_temp_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$"
    return ''.join(random.choices(chars, k=length))

""" 아이디 및 비밀번호 찾기 jwt 쿠키 생성 """
async def encode_account_recovery_temp_token(response: Response, recovery_type: str, login_id: str, email: str):
    # 인증번호 생성 (6자리)
    code = generate_random_code()
    # 쿠키 만료시간 생성
    exp = datetime.now(KST) + timedelta(minutes=5)

    # 아이디 찾기 일때
    if recovery_type == "recovery_id":
        payload = {
            "type": "recovery_id",
            "exp": exp,
            "code": code,
            "login_id": login_id
        }

        # jwt 생성
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

        # 쿠키 생성
        response.set_cookie(
            key="recovery_id",
            value=token,
            httponly=True,
            samesite="lax",
            max_age=60 * 5
        )

        # 메일 보내기 및 전송
        message = MessageSchema(
            subject="하이미디어 스터디카페, 아이디 요청 인증코드",
            recipients=[email],
            body=f"""
                <p>인증코드: {code}</p>
                <p>인증코드는 5분 뒤에 만료됩니다.</p>
                """,
            subtype=MessageType.html
        )
        await fast_mail.send_message(message)

    # 비밀번호 찾기 일때
    elif recovery_type == "recovery_pw":
        payload = {
            "type": "recovery_pw",
            "exp": exp,
            "code": code,
            "login_id": login_id
        }

        # jwt 생성
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

        # 쿠키 생성
        response.set_cookie(
            key="recovery_pw",
            value=token,
            httponly=True,
            samesite="lax",
            max_age=60 * 5
        )

        # 메일 보내기 및 전송
        message = MessageSchema(
            subject="하이미디어 스터디카페, 비밀번호 요청 인증코드",
            recipients=[email],
            body=f"""
                <p>인증코드: {code}</p>
                <p>인증코드는 5분 뒤에 만료됩니다.</p>
                """,
            subtype=MessageType.html
        )
        await fast_mail.send_message(message)
    else:
        raise HTTPException(status_code=400, detail="invalid type")

    return response

""" 아이디 및 비밀번호 찾기 jwt 쿠키 해독 """
def decode_account_recovery_temp_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") == "recovery_id" or payload.get("type") == "recovery_pw":
            return payload
        else:
            raise HTTPException(status_code=400, detail="invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="invalid token")