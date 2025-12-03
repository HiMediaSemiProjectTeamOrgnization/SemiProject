<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" /><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" /><img src="https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB" /><img src="https://img.shields.io/badge/scikit_learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" /><img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" /><img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" />

# 세미프로젝트
## 주제 - 스터디 카페 관리 시스템
## 프로젝트 가이드라인
### 프로젝트 규칙
|       | 프론트엔드                          | 백엔드                        |
|-------|--------------------------------|----------------------------|
| 폴더명   | 소문자                            | 소문자                        |
| 파일명   | 파스칼케이스(js는 카멜케이스, css는 파스칼케이스) | 스네이크케이스(라우터 주소는 케밥케이스('-')) |
### 깃 규칙
| 브랜치     | 설명               |
|---------|------------------|
| main    | 출시, 최종 merge, 백업 |
| develop | 출시 버전, 중간 merge  |
| feature | 기능 개발, 담당 부분     |
| 예시      | feature/login    |

| 커밋         | 설명                                |
|------------|-----------------------------------|
| [FEAT]     | 코드 추가                             |
| [FIX]      | 코드 수정                             |
| [STYLE]    | 코드 로직 말고 형식만 수정, 세미콜론 추가 및 들여쓰기 등 |
| [REFACTOR] | 코드 리팩토링, 결과물은 같지만 코드 로직이 수정됨      |
| [DOCS]     | 문서가 수정됨                           |
| 예시         | [FEAT] 로그인 API 엔드포인트 추가           |
## 프로젝트 전체 구조도
```
SemiProject/
├── alembic/                # DB 마이그레이션 관리
│   ├── versions/
│   └── env.py
│
├── app/                    # Backend (FastAPI)
│   ├── __init__.py
│   ├── database.py         # DB 연결 설정
│   ├── main.py             # FastAPI 메인 앱 실행
│   ├── models.py           # SQLAlchemy ORM 모델
│   ├── schemas.py          # Pydantic 데이터 스키마
│   ├── routers/            # API 엔드포인트 라우터
│   │   ├── __init__.py
│   │   ├── kiosk/
│   │   │   ├── __init__.py
│   │   │   └── kiosk.py
│   │   ├── ml/             # 머신러닝 관련 (Torch 등 사용 추정)
│   │   │   ├── __init__.py
│   │   │   └── detect.py
│   │   └── web/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       └── ticket.py
│   └── utils/              # 유틸리티 함수
│       ├── __init__.py
│       └── auth_utils.py
│
└── frontend/               # Frontend (React + Vite)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    └── src/
        ├── main.jsx        # React 진입점
        ├── App.jsx         # 메인 컴포넌트
        ├── App.css    
        ├── index.css
        ├── assets/
        ├── utils/
        │   └── useAuthStores.js
        │
        ├── kiosk/          # 키오스크 모드 관련 소스
        │   ├── KioskApp.jsx
        │   ├── components/
        │   │   ├── KioskAlertModal.jsx
        │   │   ├── KioskHeader.jsx
        │   │   ├── KioskPaymentModal.jsx
        │   │   ├── StepPhoneInput.jsx
        │   │   ├── StepPinInput.jsx
        │   │   └── StepProductList.jsx
        │   ├── pages/
        │   │   ├── BuyTicket.jsx
        │   │   ├── KioskHeader.jsx
        │   │   ├── KioskHome.jsx
        │   │   ├── Payment.jsx
        │   │   └── SelectUserType.jsx
        │   ├── screens/
        │   │   ├── KioskLogin.jsx
        │   │   ├── KioskPhoneInput.jsx
        │   │   ├── KioskTicketList.jsx
        │   │   └── KioskUserSelect.jsx
        │   └── styles/
        │       └── Kiosk.css
        │
        └── web/            # 웹 모드 관련 소스
            ├── components/
            │   ├── CommonButton.jsx
            │   └── WebLayout.jsx
            ├── pages/
            │   ├── Payment.jsx
            │   ├── TicketList.jsx
            │   └── WebIndex.jsx
            └── styles/
                ├── Payment.css
                └── TicketList.css
```
## 프론트엔드
### 폴더 구조도
```
📂 frontend/
├── 📂 public/                   # 파비콘 등 정적 파일, 잘 안쓰임
├── 📂 src/
│   ├── 📂 assets/               # 이미지, 스타일 위치한 폴더
│   ├── 📂 components/           # 재사용 가능한 작은 조각들 (버튼, 카드 등) 모인 폴더
│   │    ├── CommonButton.jsx   * 테스트 재사용 가능한 공통 버튼  
│   │    └── WebLayout.jsx      * 웹 페이지 전용 헤더, 푸터 레이아웃                                     
│   ├── 📂 pages/                # 페이지들 모은 폴더
│   │    ├── Test.jsx           * 테스트 페이지 
│   │    └── Home.jsx           * 메인 페이지 
│   └── 📂 stores/               # Zustand 스토어 및 유틸 함수 모음 폴더
│        └── useAuthStores.js    * 임시 Zustand 스토어  
├── App.css                     * 메인 어플리케이션 스타일 
├── App.jsx                     * 메인 어플리케이션
├── index.css                   * TailwindCSS 불러오는 스타일 파일
└── main.jsx                    * html 감싸는 리액트 파일
```
### 프레임워크
- React
### 라이브러리
- React Router
- Zustand
- React Query
- Tailwind CSS
### 프로젝트 설치
1. (node.js 설치, 최신 LTS 다운로드) https://nodejs.org/ko/download
2. cd frontend 
3. npm install
### 프로젝트 실행
1. npm run dev
## 백엔드
### 폴더 구조도
```
📂 backend/              # 백엔드 프로젝트 폴더          
├── 📂 alembic/          # DB 관리 라이브러리 Alembic 관련 폴더   
│   ├── 📂 versions/     # Alembic 버전들 관리하는 폴더
│   └── env.py          * Alembic 환경 설정 파일 (py)
├── 📂 app/              # 메인 로직이 있는 어플리케이션 폴더     
│   ├── 📂 routers/      # 엔드포인트 관련 라우터 폴더     
│   │   └── test.py     * 테스트 라우터 파일     
│   ├── database.py     * DB 관련 설정 파일
│   ├── main.py         * 메인(실행 및 서버) 파일                
│   ├── models.py       * ORM 정의 파일
│   └── schemas.py      * pydantic 정의 파일
├── .env                * 환경설정 관련 파일
└── alembic.ini         * Alembic 환경 설정 파일 (ini)                          
```
### 프레임워크
- FastAPI
### 라이브러리
- pyproject.toml 참고
### 프로젝트 설치
1. (윈도우 기준 uv 설치) `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"` 
2. (맥 기준 uv 설치) `brew install uv` 또는 `curl -LsSf https://astral.sh/uv/install.sh | sh` 
3. uv sync
### 프로젝트 실행
1. cd backend/app
2. uv run main.py