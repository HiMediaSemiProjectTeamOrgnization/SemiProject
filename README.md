<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />

<img src="https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white" />
<img src="https://img.shields.io/badge/Zustand-20232a?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />

<img src="https://img.shields.io/badge/scikit_learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" />
<img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
<img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" />

# 세미프로젝트
## 주제 - 제주도 관광지 코스 추천
## 프로젝트 가이드라인
### 프로젝트 규칙
|       | 프론트엔드 |백엔드|
|-------|---|---|
| 폴더명   |소문자|소문자|
| 파일명   |파스칼케이스|스네이크케이스|
### 깃 규칙
| 브랜치     | 설명               |
|---------|------------------|
| main    | 출시, 최종 merge, 백업 |
| develop | 출시 버전, 중간 merge  |
| feature | 기능 개발, 담당 부분     |

| 커밋         | 설명                                |
|------------|-----------------------------------|
| [FEAT]     | 코드 추가                             |
| [FIX]      | 코드 수정                             |
| [STYLE]    | 코드 로직 말고 형식만 수정, 세미콜론 추가 및 들여쓰기 등 |
| [REFACTOR] | 코드 리팩토링, 결과물은 같지만 코드 로직이 수정됨      |
| [DOCS]     | 문서가 수정됨                           |
| 예시         | [FEAT] 로그인 API 엔드포인트 추가           |
## 프론트엔드
### 폴더 구조도
```
📂 frontend/
├── 📂 public/               # 파비콘 등 정적 파일, 잘 안쓰임
├── 📂 src/
│   ├── 📂 api/              # (현재 추가 X) 서버 API 호출 함수 모음 (React Query용)
│   ├── 📂 assets/           # 이미지, 스타일 
│   ├── 📂 components/       # 재사용 가능한 작은 조각들 (버튼, 카드 등)
│   │    └── Layout.jsx 
│   ├── 📂 pages/            # 라우터 주소에 해당하는 큰 페이지
│   │    ├── About.jsx
│   │    └── Home.jsx
│   ├── 📂 stores/           # (현재 추가 X) Zustand 상태 저장소
│   ├── 📂 utils/            # (현재 추가 X) 날짜 변환 등 도구 함수
│   └── App.jsx
```
### 프레임워크
- React
### 라이브러리
- React Router
- Zustand
- React Query
- Tailwind CSS
### 프로젝트 설치
- (node.js 설치, 최신 LTS 다운로드) https://nodejs.org/ko/download
> cd frontend <br>
> npm install
### 프로젝트 실행
- 개발중 실행
> npm run dev
## 백엔드
### 폴더 구조도
```
📂 backend/
├── 📂 app/                      # FastAPI 관련 폴더
│   ├── 📂 routers/              # 엔드포인트 관련 폴더         
│   ├── database.py
│   ├── main.py                
│   ├── models.py
│   └── schemas.py
│
├── 📂 ml/                       # 머신러닝 관련 폴더
│   ├── 📂 routers/              # 머신러닝 엔드포인트 관련 폴더
│   ├── 📂 model_artifacts/      # 학습된 모델 파일 저장소
│   └── 📂 notebooks/            # 주피터 노트북 관련 폴더
│
└── .env
```
### 프레임워크
- FastAPI
### 라이브러리
- pyproject.toml 참고
### 프로젝트 설치
- (윈도우 기준 uv 설치) `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"` 
- (맥 기준 uv 설치) `brew install uv` 또는 `curl -LsSf https://astral.sh/uv/install.sh | sh` 
> uv sync
### 프로젝트 실행
> uv run main.py