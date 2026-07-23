import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router, legacy_auth_router
from app.core.config import settings
from app.core.exceptions import AppError, app_error_handler
from app.core.middleware import ProcessTimeMiddleware, RequestIDMiddleware
from app.db.session import dispose_engine, get_session_factory
from app.services.table import TableService
import app.models  # noqa: F401 — register ORM models with SQLAlchemy metadata

TABLE_SYNC_INTERVAL_SECONDS = 300


async def _table_status_sync_loop() -> None:
    # Skip global sync in development — it scans every table in the DB and
    # competes with menu/floor-plan requests over slow dev tunnels.
    if settings.debug or settings.environment == "development":
        return

    while True:
        await asyncio.sleep(TABLE_SYNC_INTERVAL_SECONDS)
        session_factory = get_session_factory()
        async with session_factory() as session:
            try:
                await TableService(session).sync_statuses()
            except Exception:
                await session.rollback()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    sync_task = asyncio.create_task(_table_status_sync_loop())
    try:
        yield
    finally:
        sync_task.cancel()
        with suppress(asyncio.CancelledError):
            await sync_task
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
