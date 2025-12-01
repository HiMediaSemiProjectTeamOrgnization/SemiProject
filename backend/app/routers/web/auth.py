import os
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Response, Cookie, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Token, Member
from schemas import TokenCreate, MemberCreate, MemberLogin
from utils.auth_utils import password_encode, password_decode, revoke_existing_token, set_token_cookies, get_cookies_info

router = APIRouter(prefix="/api/auth", tags=["Auth"])

load_dotenv()

KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")
KAKAO_LOGOUT_REDIRECT_URI = os.getenv("KAKAO_LOGOUT_REDIRECT_URI")
########################################################################################################################
# 일반 로그인 관련 로직
########################################################################################################################
""" 일반 회원 가입 """
@router.post("/signup")
def create_member(
    member_data: MemberCreate,
    db: Session = Depends(get_db)
):
    # 중복 유저 방지 로직
    existing_user = db.query(Member).filter(Member.login_id == member_data.login_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="exists user")

    # 비밀번호 해싱
    hashed_pw = password_encode(member_data.password)
    member = Member(
        login_id=member_data.login_id,
        name=member_data.name,
        password=hashed_pw,
        phnoe=member_data.phone
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
        member = db.query(Member).filter(Member.login_id == member_data.login_id).first()
        # 비밀번호 검증
        if not member or not password_decode(member_data.password, member.password):
            raise HTTPException(status_code=401, detail="incorrect id or password")

    # 그외 문제 예외처리
    else:
        raise HTTPException(status_code=400, detail="missing credentials")

    # 토큰 및 쿠키 생성 함수
    set_token_cookies(member.member_id, member.name, db, response)

    return {"message": "login successful"}
########################################################################################################################
# 카카오 로그인 관련 로직
########################################################################################################################
""" 카카오 로그인 """
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
        f"&prompt=login"
    )

    return RedirectResponse(url=kakao_auth_url)

""" 카카오 로그인 후 인증 코드 받기 및 카카오로 회원가입 """
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
        raise HTTPException(status_code=41, detail="token create failed")

    # OAUTH의 엑세스 토큰으로 사용자 정보 가져오기
    user_info_url = "https://kapi.kakao.com/v2/user/me"
    headers = {"Authorization": f"Bearer {kakao_access_token}"}

    async with httpx.AsyncClient() as client:
        user_response = await client.get(user_info_url, headers=headers)

    user_info = user_response.json()
    kakao_id = str(user_info.get("id"))
    kakao_phone_number = user_info.get("kakao_account", {}).get("phone_number")
    kakao_email = user_info.get("kakao_account", {}).get("email")
    kakao_birthday = user_info.get("kakao_account", {}).get("birthday")
    kakao_name = user_info.get("kakao_account", {}).get("name")

    # Member DB에서 카카오 계정 존재 확인
    kakao_account = db.query(Member).filter(
        (Member.social_type == "kakao") & (Member.login_id == kakao_id)
    ).first()

    # 카카오 계정이 DB에 존재하지 않는다면
    if not kakao_account:
        try:
            # 카카오 계정 정보를 Member DB에 추가
            member = Member(
                login_id=kakao_id,
                phone=kakao_phone_number,
                email=kakao_email,
                birthday=kakao_birthday,
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

    return {"message": "login successful"}
########################################################################################################################
# 공통 로직
########################################################################################################################
""" 로그아웃 """
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