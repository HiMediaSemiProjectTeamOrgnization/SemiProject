import os
import httpx
import uuid
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request, Response, Cookie, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Token, Member
from schemas import TokenCreate, MemberCreate, MemberLogin, MemberGoogleSetup
from utils.auth_utils import password_encode, password_decode, revoke_existing_token, set_token_cookies, get_cookies_info

router = APIRouter(prefix="/api/auth", tags=["Auth"])

load_dotenv()
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")
NAVER_REDIRECT_URI = os.getenv("NAVER_REDIRECT_URI")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
########################################################################################################################
# 일반 로그인 관련 로직
########################################################################################################################
""" 일반 회원 가입 """
@router.post("/signup")
def create_member(
    member_data: MemberCreate,
    db: Session = Depends(get_db)
):
    # 일반 회원가입 중복 유저 방지 로직
    existing_user = db.query(Member).filter(Member.login_id == member_data.login_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="exists user")

    # 비밀번호 해싱
    hashed_pw = password_encode(member_data.password)
    member = Member(
        login_id=member_data.login_id,
        name=member_data.name,
        password=hashed_pw,
        phone=member_data.phone
    )

    db.add(member)
    db.commit()

    return {"message": "signup successful"}

""" 일반 로그인 """
@router.post("/login")
def login(
    response: Response,
    member_data: MemberLogin,
    db: Session = Depends(get_db),
    refresh_token: str = Cookie(None)
):
    # 기존 DB에 저장된 토큰이 있으면 무효화
    revoke_existing_token(db, refresh_token)

    if member_data.login_id:
        # 아이디 검증
        member = db.query(Member).filter(Member.login_id == member_data.login_id).first()
        # 비밀번호 검증
        if not member or not password_decode(member_data.password, member.password):
            raise HTTPException(status_code=401, detail="incorrect id or password")

    # 그외 문제 예외처리
    else:
        raise HTTPException(status_code=400, detail="missing credentials")

    # 토큰 및 쿠키 생성 함수
    set_token_cookies(member.member_id, member.name, db, response)

    # 만약 저장된 쿠키가 없을시에 기존 DB의 리프레시 토큰들 무효화
    prev_refresh = db.query(Token).filter(Token.member_id == member.member_id).all()
    if prev_refresh:
        for refresh in prev_refresh:
            refresh.is_revoked = True
        db.commit()

    return {"message": "login successful"}
########################################################################################################################
# 카카오 로그인 관련 로직
########################################################################################################################
""" 카카오 로그인 리다이렉트 """
@router.get("/kakao/login")
async def kakao_login(
    db: Session = Depends(get_db),
    refresh_token: str = Cookie(None)
):
    # 기존 DB에 저장된 토큰이 있으면 무효화
    revoke_existing_token(db, refresh_token)

    kakao_auth_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?response_type=code"
        f"&client_id={KAKAO_CLIENT_ID}"
        f"&redirect_uri={KAKAO_REDIRECT_URI}"
        f"&prompt=select_account"
    )

    return RedirectResponse(url=kakao_auth_url)

""" 카카오 로그인 콜백 """
@router.get("/kakao/callback")
async def kakao_callback(
    code: str,
    db: Session = Depends(get_db)
):
    # 리다이렉트 할 URL 주소
    response = RedirectResponse(url="/")

    # 토큰 요청 URL 및 data
    token_url = "https://kauth.kakao.com/oauth/token"

    token_data = {
        "grant_type": "authorization_code",
        "client_id": KAKAO_CLIENT_ID,
        "redirect_uri": KAKAO_REDIRECT_URI,
        "client_secret": KAKAO_CLIENT_SECRET,
        "code": code
    }

    # OAUTH에서 엑세스, 리프레시 토큰 요청
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)

        # 카카오의 엑세스 토큰은 오직 유저 정보를 받아오는 용도로만 사용한다.
        # 유저 정보를 토대로 자체 JWT로 만든 엑세스, 리프레시 토큰으로 관리한다.
        token_json = token_response.json()
        kakao_access_token = token_json.get("access_token")

        if not kakao_access_token:
            raise HTTPException(status_code=401, detail="token create failed")

        # OAUTH의 엑세스 토큰으로 사용자 정보 가져오기
        user_info_url = "https://kapi.kakao.com/v2/user/me"
        headers = {"Authorization": f"Bearer {kakao_access_token}"}
        user_response = await client.get(user_info_url, headers=headers)
        user_info = user_response.json()

    kakao_id = str(user_info.get("id"))
    kakao_phone_number = user_info.get("kakao_account").get("phone_number", {})
    kakao_email = user_info.get("kakao_account").get("email", {})
    kakao_birthday = user_info.get("kakao_account").get("birthday", {})
    kakao_birthyear = user_info.get("kakao_account").get("birthyear", {})
    kakao_name = user_info.get("kakao_account").get("name", {})

    # 전처리
    # 010-XXXX-XXXX 형식으로만 받아야 함
    kakao_phone_number = kakao_phone_number.replace(kakao_phone_number.split("-")[0], "010")

    # Member DB에서 카카오 계정 존재 확인
    kakao_account = db.query(Member).filter(
        (Member.social_type == "kakao") & (Member.kakao_id == kakao_id)
    ).first()

    # 카카오 계정이 DB에 존재하지 않는다면
    if not kakao_account:
        try:
            # 카카오 계정 정보를 Member DB에 추가
            member = Member(
                kakao_id=kakao_id,
                phone=kakao_phone_number,
                email=kakao_email,
                birthday=kakao_birthyear + kakao_birthday,
                social_type="kakao",
                name=kakao_name,
            )
            db.add(member)
            db.commit()
            db.refresh(member)

            payload_member_id = member.member_id
            payload_member_name = member.name
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"transaction failed: {e}")

    # 카카오 계정이 DB에 존재하는 경우
    else:
        payload_member_id = kakao_account.member_id
        payload_member_name = kakao_account.name

    # 공통 로직
    # 토큰 및 쿠키 생성 함수
    set_token_cookies(payload_member_id, payload_member_name, db, response)

    # 만약 저장된 쿠키가 없을시에 기존 DB의 리프레시 토큰들 무효화
    prev_refresh = db.query(Token).filter(Token.member_id == kakao_account.member_id).all()
    if prev_refresh:
        for refresh in prev_refresh:
            refresh.is_revoked = True
        db.commit()

    return response
########################################################################################################################
# 네이버 로그인 관련 로직
########################################################################################################################
""" 네이버 로그인 리다이렉트 """
@router.get("/naver/login")
async def naver_login(
    db: Session = Depends(get_db),
    refresh_token: str = Cookie(None)
):
    # 기존 DB에 저장된 토큰이 있으면 무효화
    revoke_existing_token(db, refresh_token)

    # 랜덤 state 생성
    state = str(uuid.uuid4())

    naver_auth_url = (
        f"https://nid.naver.com/oauth2.0/authorize"
        f"?response_type=code"
        f"&client_id={NAVER_CLIENT_ID}"
        f"&redirect_uri={NAVER_REDIRECT_URI}"
        f"&state={state}"
        f"&auth_type=reauthenticate"
    )

    # 네이버 oauth용 state를 쿠키에 저장
    response = RedirectResponse(url=naver_auth_url)
    response.set_cookie(
        key="naver_oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
        max_age=60 * 5
    )

    return response

""" 네이버 로그인 콜백 """
@router.get("/naver/callback")
async def naver_callback(
    code: str,
    naver_oauth_state: str = Cookie(None),
    db: Session = Depends(get_db)
):
    # state가 없을 시
    if not naver_oauth_state:
        raise HTTPException(status_code=404, detail="oauth state not found")

    # 리다이렉트 할 URL 주소
    response = RedirectResponse(url="/")

    # 토큰 요청 URL 및 data
    token_url = "https://nid.naver.com/oauth2.0/token"

    token_data = {
        "grant_type": "authorization_code",
        "client_id": NAVER_CLIENT_ID,
        "client_secret": NAVER_CLIENT_SECRET,
        "redirect_uri": NAVER_REDIRECT_URI,
        "code": code,
        "state": naver_oauth_state
    }

    # OAUTH에서 엑세스, 리프레시 토큰 요청
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)

        # 네이버의 엑세스 토큰은 오직 유저 정보를 받아오는 용도로만 사용한다.
        # 유저 정보를 토대로 자체 JWT로 만든 엑세스, 리프레시 토큰으로 관리한다.
        token_json = token_response.json()
        naver_access_token = token_json.get("access_token")

        if not naver_access_token:
            raise HTTPException(status_code=401, detail="token create failed")

        # OAUTH의 엑세스 토큰으로 사용자 정보 가져오기
        user_info_url = "https://openapi.naver.com/v1/nid/me"
        headers = {"Authorization": f"Bearer {naver_access_token}"}
        user_response = await client.get(user_info_url, headers=headers)
        user_info = user_response.json().get("response")

    naver_id = str(user_info.get("id"))
    naver_phone_number = user_info.get("mobile", {})
    naver_email = user_info.get("email", {})
    naver_birthday = user_info.get("birthday", {})
    naver_birthyear = user_info.get("birthyear", {})
    naver_name = user_info.get("name", {})

    # 전처리
    naver_birthday = naver_birthday.replace("-", "")

    # Member DB에서 네이버 계정 존재 확인
    naver_account = db.query(Member).filter(
        (Member.social_type == "naver") & (Member.naver_id == naver_id)
    ).first()

    # 네이버 계정이 DB에 존재하지 않는다면
    if not naver_account:
        try:
            # 네이버 계정 정보를 Member DB에 추가
            member = Member(
                naver_id=naver_id,
                phone=naver_phone_number,
                email=naver_email,
                birthday=naver_birthyear + naver_birthday,
                social_type="naver",
                name=naver_name,
            )
            db.add(member)
            db.commit()
            db.refresh(member)

            payload_member_id = member.member_id
            payload_member_name = member.name
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"transaction failed: {e}")

    # 네이버 계정이 DB에 존재하는 경우
    else:
        payload_member_id = naver_account.member_id
        payload_member_name = naver_account.name

    # 공통 로직
    # 토큰 및 쿠키 생성 함수
    set_token_cookies(payload_member_id, payload_member_name, db, response)

    # 만약 저장된 쿠키가 없을시에 기존 DB의 리프레시 토큰들 무효화
    prev_refresh = db.query(Token).filter(Token.member_id == naver_account.member_id).all()
    if prev_refresh:
        for refresh in prev_refresh:
            refresh.is_revoked = True
        db.commit()

    # state 쿠키 다시 제거
    response.delete_cookie("naver_oauth_state")

    # 네이버 access 쿠키 설정
    response.set_cookie(
        key="naver_access_token",
        value=naver_access_token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60
    )

    return response
########################################################################################################################
# 구글 로그인 관련 로직
########################################################################################################################
""" 구글 로그인 리다이렉트 """
@router.get("/google/login")
async def google_login(
    db: Session = Depends(get_db),
    refresh_token: str = Cookie(None)
):
    # 기존 DB에 저장된 토큰이 있으면 무효화
    revoke_existing_token(db, refresh_token)

    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth"
        f"?response_type=code"
        f"&client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&scope=openid%20email%20profile"
        f"&prompt=select_account"
    )

    return RedirectResponse(url=google_auth_url)

""" 구글 로그인 콜백 """
@router.get("/google/callback")
async def google_callback(
    code: str,
    db: Session = Depends(get_db)
):
    # 리다이렉트 할 URL 주소
    response = RedirectResponse(url="/")

    # 토큰 요청 URL 및 data
    token_url = "https://oauth2.googleapis.com/token"

    token_data = {
        "grant_type": "authorization_code",
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "code": code
    }

    # OAUTH에서 엑세스, 리프레시 토큰 요청
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)

        # 구글의 엑세스 토큰은 오직 유저 정보를 받아오는 용도로만 사용한다.
        # 유저 정보를 토대로 자체 JWT로 만든 엑세스, 리프레시 토큰으로 관리한다.
        token_json = token_response.json()
        google_access_token = token_json.get("access_token")

        if not google_access_token:
            raise HTTPException(status_code=401, detail="token create failed")

        # OAUTH의 엑세스 토큰으로 사용자 정보 가져오기
        user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
        headers = {"Authorization": f"Bearer {google_access_token}"}
        user_response = await client.get(user_info_url, headers=headers)
        user_info = user_response.json()

    # 구글은 phone_number, birthday, birthyear 안보냄
    google_id = str(user_info.get("sub"))
    google_email = user_info.get("email", {})
    google_name = user_info.get("name", {})

    # Member DB에서 구글 계정 존재 확인
    google_account = db.query(Member).filter(
        (Member.social_type == "google") & (Member.naver_id == google_id)
    ).first()

    # 구글 계정이 DB에 존재하지 않는다면
    if not google_account:
        # phone_number, birthday, birthyear 추가 정보 입력을 위한 페이지 이동
        # 리다이렉트 url 설정
        response = RedirectResponse(url="/google/setup")

        # 쿠키로 저장하기 위해 그 외 정보 한 문자열로 합치기 (split하기 위해서)
        temp_member = f"{google_id}/[google]/{google_email}/[google]/{google_name}"

        # 쿠키에 그 외 정보 저장
        response.set_cookie(
            key="temp_member",
            value=temp_member,
            httponly=True,
            samesite="lax",
            max_age=60 * 5
        )

        return response

    # 구글 계정이 DB에 존재하는 경우
    else:
        payload_member_id = google_account.member_id
        payload_member_name = google_account.name

    # 공통 로직
    # 토큰 및 쿠키 생성 함수
    set_token_cookies(payload_member_id, payload_member_name, db, response)

    # 만약 저장된 쿠키가 없을시에 기존 DB의 리프레시 토큰들 무효화
    prev_refresh = db.query(Token).filter(Token.member_id == google_account.member_id).all()
    if prev_refresh:
        for refresh in prev_refresh:
            refresh.is_revoked = True
        db.commit()

    return response

""" 구글 로그인 추가 정보 입력 """
@router.post("/google/setup")
async def google_setup(
    response: Response,
    request: Request,
    temp_member: str = Cookie(None),
    db: Session = Depends(get_db)
):
    # 쿠키 가져오기
    # 예외 처리
    if not temp_member:
        raise HTTPException(status_code=401, detail="cookie not found")

    # 쿠키 내용 언패킹
    google_id, google_email, google_name = temp_member.split("/[google]/")

    # 추가 정보를 담은 쿠키 제거
    response.delete_cookie("temp_member")

    # 폼 데이터 가져오기
    form_data = await request.form()
    member_data = MemberGoogleSetup(**form_data)

    # 휴대폰 번호 중복 확인
    phone_mem = db.query(Member).filter(Member.phone == member_data.phone).first()
    if phone_mem:
        raise HTTPException(status_code=409, detail="already exists phone number")

    # 구글 계정 정보를 Member DB에 추가
    google_account = Member(
        google_id=google_id,
        email=google_email,
        social_type="google",
        name=google_name,
        phone=member_data.phone,
        birthday=member_data.birthday
    )
    db.add(google_account)
    db.commit()
    db.refresh(google_account)

    # 토큰 및 쿠키 생성 함수
    set_token_cookies(google_account.member_id, google_account.name, db, response)

    # 만약 저장된 쿠키가 없을시에 기존 DB의 리프레시 토큰들 무효화
    prev_refresh = db.query(Token).filter(Token.member_id == google_account.member_id).all()
    if prev_refresh:
        for refresh in prev_refresh:
            refresh.is_revoked = True
        db.commit()
########################################################################################################################
# 공통 로직
########################################################################################################################
""" 로그아웃 """
@router.post("/logout")
def logout(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    # 서버에 있는 리프레시 토큰 무효화
    revoke_existing_token(db, refresh_token)

    # 쿠키 삭제
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {"message": "logout successful"}
########################################################################################################################
# 테스트 관련 로직
########################################################################################################################
""" JWT 토큰 테스트용 페이지 """
@router.get("/token_test", response_class=HTMLResponse)
def get_profile(member: dict = Depends(get_cookies_info)):
    return f"""
    <html>
        <body>
            <h1>👤 내 프로필</h1>
            <h2>안녕하세요, {member["name"]}님!</h2>
            <h2>당신의 member_id: {member["member_id"]}님!</h2>
        </body>
    </html>
    """

""" 카카오 로그인 테스트 페이지 """
@router.get('/kakao_test', response_class=HTMLResponse)
def kakao_login():
    return """
    <!DOCTYPE html>
    <html>
    <body>
        <div class="container">
        <h3>카카오 로그인</h3>
        <a href="/api/auth/kakao/login">
            <img src="/images/kakao_login.png" alt='카카오 로그인' style="width: 120px; cursor: pointer;">
        </a>
    </body>
    </html>
    """

""" 네이버 로그인 테스트 페이지 """
@router.get('/naver_test', response_class=HTMLResponse)
def kakao_login():
    return """
    <!DOCTYPE html>
    <html>
    <body>
        <div class="container">
        <h3>네이버 로그인</h3>
        <a href="/api/auth/naver/login">
            <img src="/images/kakao_login.png" alt='네이버 로그인' style="width: 120px; cursor: pointer;">
        </a>
    </body>
    </html>
    """

""" 구글 로그인 테스트 페이지 """
@router.get('/google_test', response_class=HTMLResponse)
def kakao_login():
    return """
    <!DOCTYPE html>
    <html>
    <body>
        <div class="container">
        <h3>구글 로그인</h3>
        <a href="/api/auth/google/login">
            <img src="/images/kakao_login.png" alt='네이버 로그인' style="width: 120px; cursor: pointer;">
        </a>
    </body>
    </html>
    """

""" 구글 로그인 추가정보 입력 페이지 """
@router.get('/google/setup', response_class=HTMLResponse)
def kakao_login():
    return """
    <!DOCTYPE html>
    <html>
    <body>
        <div class="container">
        <h3>네이버 로그인</h3>
        <form method="post" action="/api/auth/naver/login">
        <input type"text" name="phone">휴대폰번호<br>
        <input type"text" name="birthday">생일<br>
        <button type="submit">제출</button>
        </form>
    </body>
    </html>
    """