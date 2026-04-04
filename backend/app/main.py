from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base
from app.auth.router import router as auth_router
from app.routers.vehicles import router as vehicles_router
from app.routers.sessions import router as sessions_router
from app.routers.ecu_profiles import router as ecu_profiles_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="OpenLogger API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(vehicles_router)
app.include_router(sessions_router)
app.include_router(ecu_profiles_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
