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
from utils.auth_utils import password_encode, password_decode, revoke_existing_token, revoke_existing_token_by_id, set_token_cookies, get_cookies_info, encode_temp_signup_token, decode_temp_signup_token, verify_token, create_access_token, create_refresh_token, encode_google_temp_token, decode_google_temp_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL")
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
    response: Response,
    db: Session = Depends(get_db)
):
    # 아이디 중복 조회
    id_exists = db.query(Member).filter(Member.login_id == member_data.login_id).first()
    if id_exists:
        raise HTTPException(status_code=409, detail="already used loginid")

    # 휴대폰 번호 조회
    existing_member = db.query(Member).filter(Member.phone == member_data.phone).first()

    # 비밀번호 해싱
    hashed_pw = password_encode(member_data.password)

    # 휴대폰 번호가 존재할때
    if existing_member:
        # 로그인 id가 존재할때
        if existing_member.login_id:
            raise HTTPException(status_code=400, detail="exists loginid")

        # 로그인 id가 존재하지 않을때, 연동가입
        # 정보 업데이트
        existing_member.login_id = member_data.login_id
        existing_member.password = hashed_pw
        existing_member.name = member_data.name
        db.commit()
        db.refresh(existing_member)

        # 토큰 및 쿠키 생성 함수
        set_token_cookies(existing_member.member_id, existing_member.name, db, response)

    # 휴대폰 번호가 존재하지 않을 때, 회원가입
    else:
        member = Member(
            login_id=member_data.login_id,
            name=member_data.name,
            password=hashed_pw,
            phone=member_data.phone
        )
        db.add(member)
        db.commit()

        # 토큰 및 쿠키 생성 함수
        set_token_cookies(member.member_id, member.name, db, response)

    response.status_code = 201

    return {"status": "ok"}

""" 일반 로그인 """
@router.post("/login")
def login(
    response: Response,
    member_data: MemberLogin,
    db: Session = Depends(get_db),
    refresh_token: str = Cookie(None)
):
    # 기존 DB의 리프레시 토큰들 무효화 (쿠키)
    revoke_existing_token(db, refresh_token)

    if member_data.login_id:
        # 아이디 검증
        member = db.query(Member).filter(Member.login_id == member_data.login_id).first()

        # 비밀번호 검증
        if not member or not password_decode(member_data.password, member.password):
            raise HTTPException(status_code=400, detail="incorrect id or password")

    # 그외 문제 예외처리
    else:
        raise HTTPException(status_code=401, detail="missing credentials")

    # 기존 DB의 리프레시 토큰들 무효화 (id)
    revoke_existing_token_by_id(db, member.member_id)

    # 토큰 및 쿠키 생성 함수
    set_token_cookies(member.member_id, member.name, db, response)

    return {"status": "ok"}
########################################################################################################################
# 카카오 로그인 관련 로직
########################################################################################################################
""" 카카오 로그인 리다이렉트 """
@router.get("/kakao/login")
async def kakao_login(
    db: Session = Depends(get_db),
    refresh_token: str = Cookie(None)
):
    # 기존 DB의 리프레시 토큰들 무효화 (쿠키)
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
    response = RedirectResponse(url=f"{FRONTEND_URL}/web")

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

    # 카카오 계정이 존재 할때, 로그인
    if kakao_account:
        # 토큰 및 쿠키 생성 함수
        set_token_cookies(kakao_account.member_id, kakao_account.name, db, response)

        # 기존 DB의 리프레시 토큰들 무효화 (id)
        revoke_existing_token_by_id(db, kakao_account.member_id)

    # 카카오 계정이 존재하지 않을 때
    else:
        # 휴대폰 번호 조회
        existing_member = db.query(Member).filter(Member.phone == kakao_phone_number).first()

        # 휴대폰 번호가 존재 할때, 연동가입
        if existing_member:
            # 이메일이 존재하지 않을 때만 업데이트
            if not existing_member.email:
                existing_member.email = kakao_email
            existing_member.social_type = "kakao"
            existing_member.kakao_id = kakao_id
            db.commit()
            db.refresh(existing_member)

            # 토큰 및 쿠키 생성 함수
            set_token_cookies(existing_member.member_id, existing_member.name, db, response)

            # 기존 DB의 리프레시 토큰들 무효화 (id)
            revoke_existing_token_by_id(db, existing_member.member_id)

        # 휴대폰 번호가 존재하지 않을때, 회원가입
        else:
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

                # 토큰 및 쿠키 생성 함수
                set_token_cookies(member.member_id, member.name, db, response)

                # 기존 DB의 리프레시 토큰들 무효화 (id)
                revoke_existing_token_by_id(db, member.member_id)
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"transaction failed: {e}")

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
    # 기존 DB의 리프레시 토큰들 무효화 (쿠키)
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
    response = RedirectResponse(url=f"{FRONTEND_URL}/web")

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

    # 네이버 계정이 존재 할때, 로그인
    if naver_account:
        # 토큰 및 쿠키 생성 함수
        set_token_cookies(naver_account.member_id, naver_account.name, db, response)

        # 기존 DB의 리프레시 토큰들 무효화 (id)
        revoke_existing_token_by_id(db, naver_account.member_id)

    else:
        # 휴대폰 번호 조회
        existing_member = db.query(Member).filter(Member.phone == naver_phone_number).first()

        # 휴대폰 번호가 존재 할때, 연동가입
        if existing_member:
            # 이메일이 존재하지 않을 때만 업데이트
            if not existing_member.email:
                existing_member.email = naver_email
            existing_member.social_type = "naver"
            existing_member.naver_id = naver_id
            db.commit()
            db.refresh(existing_member)

            # 토큰 및 쿠키 생성 함수
            set_token_cookies(existing_member.member_id, existing_member.name, db, response)

            # 기존 DB의 리프레시 토큰들 무효화 (id)
            revoke_existing_token_by_id(db, existing_member.member_id)

        # 휴대폰 번호가 존재하지 않을때, 회원가입
        else:
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

                # 토큰 및 쿠키 생성 함수
                set_token_cookies(member.member_id, member.name, db, response)

                # 기존 DB의 리프레시 토큰들 무효화 (id)
                revoke_existing_token_by_id(db, member.member_id)
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"transaction failed: {e}")

    # state 쿠키 다시 제거
    response.delete_cookie("naver_oauth_state")

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
    # 기존 DB의 리프레시 토큰들 무효화 (쿠키)
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
    request: Request,
    db: Session = Depends(get_db)
):
    # 리다이렉트 할 URL 주소
    response = RedirectResponse(url=f"{FRONTEND_URL}/web")

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
        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {google_access_token}"}
        user_response = await client.get(user_info_url, headers=headers)
        user_info = user_response.json()

    # 구글은 phone_number, birthday, birthyear 안보냄
    google_id = str(user_info.get("sub"))
    google_email = user_info.get("email", {})
    google_name = user_info.get("name", {})

    # Member DB에서 구글 계정 존재 확인
    google_account = db.query(Member).filter(
        (Member.social_type == "google") & (Member.google_id == google_id)
    ).first()

    # 구글 계정이 존재 할때, 로그인
    if google_account:
        # 토큰 및 쿠키 생성 함수
        set_token_cookies(google_account.member_id, google_account.name, db, response)

        # 기존 DB의 리프레시 토큰들 무효화 (id)
        revoke_existing_token_by_id(db, google_account.member_id)

    # 구글 계정이 존재하지 않을때
    else:
        # 쿠키 정보 가져오기
        access_token = request.cookies.get("access_token")
        refresh_token = request.cookies.get("refresh_token")
        current_member_id = None

        # 엑세스 토큰 검증
        if access_token:
            mem_info, error = verify_token(db, access_token, "access")
            if not error:
                current_member_id = mem_info["member_id"]

        # 엑세스 토큰 실패 시, 리프레시 토큰 검증
        if not current_member_id and refresh_token:
            mem_info, error = verify_token(db, refresh_token, "refresh")
            if not error:
                # DB에서도 유효한지 확인
                db_token = db.query(Token).filter((Token.token == refresh_token) & (Token.is_revoked == False)).first()
                if db_token:
                    current_member_id = mem_info["member_id"]

        # 휴대폰 번호 조회
        existing_member = db.query(Member).filter(Member.member_id == current_member_id).first()

        # 휴대폰 번호가 존재 할때, 연동가입 (마이페이지 O)
        if existing_member:
            # 이메일이 존재하지 않을 때만 업데이트
            if not existing_member.email:
                existing_member.email = google_email
            existing_member.social_type = "google"
            existing_member.google_id = google_id
            db.commit()
            db.refresh(existing_member)

            # 토큰 및 쿠키 생성 함수
            set_token_cookies(existing_member.member_id, existing_member.name, db, response)

            # 기존 DB의 리프레시 토큰들 무효화 (id)
            revoke_existing_token_by_id(db, existing_member.member_id)

        # 휴대폰 번호가 존재하지 않을 때
        else:
            # phone_number, birthday, birthyear 추가 정보 입력을 위한 페이지 이동
            # 리다이렉트 url 설정
            response = RedirectResponse(url=f"{FRONTEND_URL}/web/google/setup")

            # 쿠키로 저장하기 위해 정보 담기 및 JWT 변환
            payload = {
                "google_id": google_id,
                "google_email": google_email,
                "google_name": google_name
            }
            temp_member = encode_temp_signup_token(payload)

            # 쿠키에 그 외 정보 저장
            response.set_cookie(
                key="temp_member",
                value=temp_member,
                httponly=True,
                samesite="lax",
                max_age=60 * 5
            )

            # 임시 페이지 인증용 쿠키 발급
            temp_google_check = encode_google_temp_token()
            response.set_cookie(
                key="temp_google_check",
                value=temp_google_check,
                httponly=True,
                samesite="lax",
                max_age=60 * 5
            )

    return response

""" 구글 로그인 추가 정보 입력 """
@router.post("/google/setup")
def google_setup(
    response: Response,
    member: MemberGoogleSetup,
    temp_member: str = Cookie(None),
    db: Session = Depends(get_db)
):
    # 쿠키 가져오기
    # 쿠키가 없을때 예외 처리
    if not temp_member:
        raise HTTPException(status_code=401, detail="cookie not found")

    # 쿠키 내용 언패킹 및 해독
    mem_info = decode_temp_signup_token(temp_member)

    # 추가 정보를 담은 쿠키 및 임시 체크 쿠키 제거
    response.delete_cookie("temp_member")
    response.delete_cookie("temp_google_check")

    # 휴대폰 번호 조회
    existing_member = db.query(Member).filter(Member.phone == member.phone).first()

    # 휴대폰 번호가 존재 할때, 연동가입 (마이페이지 X)
    if existing_member:
        # 이메일이 존재하지 않을 때만 업데이트
        if not existing_member.email:
            existing_member.email = mem_info["google_email"]
        existing_member.social_type = "google"
        existing_member.google_id = mem_info["google_id"]
        db.commit()
        db.refresh(existing_member)

        # 토큰 및 쿠키 생성 함수
        set_token_cookies(existing_member.member_id, existing_member.name, db, response)

        # 기존 DB의 리프레시 토큰들 무효화 (id)
        revoke_existing_token_by_id(db, existing_member.member_id)

    # 휴대폰 번호가 존재하지 않을때, 회원가입
    else:
        try:
            # 구글 계정 정보를 Member DB에 추가
            member = Member(
                google_id=mem_info["google_id"],
                email=mem_info["google_email"],
                social_type="google",
                name=mem_info["google_name"],
                phone=member.phone,
                birthday=member.birthday
            )
            db.add(member)
            db.commit()
            db.refresh(member)

            # 토큰 및 쿠키 생성 함수
            set_token_cookies(member.member_id, member.name, db, response)

            # 기존 DB의 리프레시 토큰들 무효화 (id)
            revoke_existing_token_by_id(db, member.member_id)
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"transaction failed: {e}")

    return {"status": "ok"}

""" 구글 추가정보 검증 토큰 가져오기 """
@router.post("/google/temp")
def get_google_temp_token(
    temp_google_check: str = Cookie(None)
):
    if not temp_google_check:
        raise HTTPException(status_code=401, detail="cookie not exists")
    try:
        temp_info = decode_google_temp_token(temp_google_check)

        if temp_info and temp_info["check"] == "check":
            return {"status": "ok"}

        raise HTTPException(status_code=401, detail="invalid check")
    except Exception:
        raise HTTPException(status_code=401, detail="token error")
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

""" 로그인 정보 가져오는 함수 """
@router.post("/cookies")
def get_cookies(member: dict = Depends(get_cookies_info)):

    return member
########################################################################################################################
# 테스트 관련 로직
########################################################################################################################
""" JWT 토큰 테스트용 페이지 """
@router.get("/token_test", response_class=HTMLResponse)
def token_test(member: dict = Depends(get_cookies_info)):
    return f"""
    <html>
        <body>
            <h1>👤 내 프로필</h1>
            <h2>안녕하세요, {member["name"]}님!</h2>
            <h2>당신의 member_id: {member["member_id"]}님!</h2>
        </body>
    </html>
    """