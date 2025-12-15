import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from ai_models.sbert import model_manager
from database import create_tables
from routers.kiosk import kiosk
from routers.web import auth, ticket, mypage, plan
from routers.admin import admin
from routers.ml import detect

@asynccontextmanager
async def lifespan(life_app: FastAPI):
    create_tables()
    print("🚀 서버 시작 중...")
    model_manager.load_models()
    print("✅ 서버 시작 완료!\n")
    ticket.start_scheduler()
    yield  # 서버 실행 중
    print("\n🛑 서버 종료 중...")
    model_manager.unload_models()
    print("✅ 서버 종료 완료!")

app = FastAPI(lifespan=lifespan)

os.makedirs("captures", exist_ok=True)
app.mount("/captures", StaticFiles(directory="captures"), name="captures")

app.include_router(auth.router)
app.include_router(kiosk.router)
app.include_router(ticket.router)
app.include_router(detect.router)
app.include_router(mypage.router)
app.include_router(admin.router)
app.include_router(plan.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://192.168.0.31:5173", "http://172.24.16.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )