import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from database import create_tables
from routers.kiosk import kiosk
from routers.web import auth, ticket
from routers.ml import detect

@asynccontextmanager
async def lifespan(life_app: FastAPI):
    create_tables()
    ticket.start_scheduler()
    yield

app = FastAPI(lifespan=lifespan)

os.makedirs("captures", exist_ok=True)
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
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )