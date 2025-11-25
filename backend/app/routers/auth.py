from fastapi import APIRouter, HTTPException, Form, Response, Cookie
from fastapi.responses import HTMLResponse, RedirectResponse
from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import os

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
KST = ZoneInfo("Asia/Seoul")

# 사용자 데이터베이스
users = {
    "admin": "1234",
    "user": "1234"
}

# Refresh Token 저장소 (서버에서 관리)
refresh_tokens = {}

""" Access Token 생성 - 짧은 수명 (1분) """
def create_access_token(name):
    payload = {
        "name": name,
        "type": "access",
        "exp": datetime.now(KST) + timedelta(minutes=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

""" Refresh Token 생성 - 긴 수명 (7일) """
def create_refresh_token(name):
    payload = {
        "name": name,
        "type": "refresh",
        "exp": datetime.now(KST) + timedelta(days=7)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    refresh_tokens[token] = {
        "name": name,
        "created_at": datetime.now(KST)
    }

    return token

""" JWT 토큰 검증 """
def verify_token(token: str, token_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        name = payload.get("name")
        type_check = payload.get("type")

        # 토큰 타입 확인
        if type_check != token_type:
            return None, "invalid"

        return name, None

    except ExpiredSignatureError:
        return None, "expired"
    except JWTError:
        return None, "invalid"

""" 로그인 - Access Token + Refresh Token 발급 """
@router.post("/login")
def login(response: Response, name: str = Form(...), password: str = Form(...)):
    # 1. 사용자 확인
    if name not in users or users[name] != password:
        raise HTTPException(status_code=401, detail="잘못된 로그인 정보")

    # 2. Access Token 생성 (1분)
    access_token = create_access_token(name)

    # 3. Refresh Token 생성 (7일)
    refresh_token = create_refresh_token(name)

    # 4. 프로필로 리다이렉트
    response = RedirectResponse(url='/profile', status_code=302)

    # 5. 토큰들을 쿠키에 저장
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60  # 1분
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=60*60*24*7 # 7일
    )

    return response

""" 프로필 페이지 - Access Token 필요 """
@router.get("/profile", response_class=HTMLResponse)
def get_profile(access_token: str = Cookie(None), refresh_token: str = Cookie(None)):
    # 1. Access Token이 없으면 Refresh 시도
    if not access_token:
        if refresh_token:
            return RedirectResponse(url='/refresh', status_code=302)
        return RedirectResponse(url='/')

    # 2. Access Token 검증
    username, error = verify_token(access_token, "access")

    # 3. Access Token 만료 시 자동 갱신
    if error == "expired":
        if refresh_token:
            return RedirectResponse(url='/refresh', status_code=302)
        return RedirectResponse(url='/')

    # 4. 유효하지 않은 토큰
    if error == "invalid" or not username:
        return RedirectResponse(url='/')

    # 5. 성공 - 프로필 페이지 반환
    return f"""
    <html>
        <body>
            <h1>👤 내 프로필</h1>
            <h2>안녕하세요, {username}님!</h2>
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


@app.get("/refresh")
def refresh(
        response: Response,
        refresh_token: str = Cookie(None)
):
    """Refresh Token으로 새 Access Token 발급"""

    # 1. Refresh Token 확인
    if not refresh_token:
        return RedirectResponse(url='/')

    # 2. 서버에 저장된 토큰인지 확인
    if refresh_token not in refresh_tokens:
        return RedirectResponse(url='/')

    # 3. Refresh Token 검증
    username, error = verify_token(refresh_token, "refresh")

    # 4. Refresh Token 만료됨
    if error == "expired":
        # 만료된 토큰 제거
        if refresh_token in refresh_tokens:
            del refresh_tokens[refresh_token]
        return RedirectResponse(url='/')

    # 5. 유효하지 않은 토큰
    if error == "invalid" or not username:
        return RedirectResponse(url='/')

    # 6. 새 Access Token 발급
    new_access_token = create_access_token(username)

    # 7. 프로필로 리다이렉트하면서 새 토큰 저장
    response = RedirectResponse(url='/profile', status_code=302)
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        max_age=60  # 1분
    )

    return response


@app.post("/logout")
def logout(response: Response, refresh_token: str = Cookie(None)):
    """로그아웃 - 모든 토큰 삭제"""

    # 서버에서 Refresh Token 제거
    if refresh_token and refresh_token in refresh_tokens:
        del refresh_tokens[refresh_token]

    # 쿠키 삭제
    response = RedirectResponse(url='/', status_code=302)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return response


@app.get("/token_check")
def token_check():
    return {
        "active_refresh_tokens": len(refresh_tokens),
        "tokens": [
            {
                "username": data["username"],
                "created_at": data["created_at"]
            }
            for data in refresh_tokens.values()
        ]
    }