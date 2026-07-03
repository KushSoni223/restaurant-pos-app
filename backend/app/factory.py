from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router, legacy_auth_router
from app.core.config import settings
from app.core.exceptions import AppError, app_error_handler
from app.core.middleware import ProcessTimeMiddleware, RequestIDMiddleware
from app.db.session import dispose_engine
import app.models  # noqa: F401 — register ORM models with SQLAlchemy metadata


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await dispose_engine()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        lifespan=lifespan,
        openapi_url="/openapi.json",
    )

    cors_origins = settings.cors_origin_list
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=cors_origins != ["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(ProcessTimeMiddleware)
    app.add_middleware(RequestIDMiddleware)

    app.add_exception_handler(AppError, app_error_handler)

    app.include_router(api_router)
    app.include_router(legacy_auth_router)

    @app.get("/", tags=["root"])
    async def root() -> dict[str, str]:
        return {"message": f"Welcome to {settings.app_name}"}

    return app
