import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_tables
from routers.kiosk import kiosk
from routers.web import auth, ticket
from routers.ml import detect
from fastapi.staticfiles import StaticFiles # 추가
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(lifespan=lifespan)

# captures 폴더가 없으면 생성
os.makedirs("captures", exist_ok=True)

# URL에서 /captures 로 접근하면 실제 captures 폴더를 보여줌
app.mount("/captures", StaticFiles(directory="captures"), name="captures")

app.include_router(auth.router)
app.include_router(kiosk.router)
app.include_router(ticket.router)
app.include_router(detect.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://192.168.0.31:5173", "http://172.24.16.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

if __name__ == "__main__":
    uvicorn.run("main:app",
                host="localhost",
                port=8000,
                reload=True)
    
