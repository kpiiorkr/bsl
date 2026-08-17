from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, get_settings
from .errors import (
    ApiError,
    api_error_handler,
    internal_error_handler,
    validation_error_handler,
)
from .routers import create_router


def create_app(settings: Settings | None = None) -> FastAPI:
    configured = settings or get_settings()
    application = FastAPI(
        title="급식 배틀 Backend API",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=configured.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET"],
        allow_headers=["*"],
    )
    application.add_exception_handler(ApiError, api_error_handler)  # type: ignore[arg-type]
    application.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
    application.add_exception_handler(Exception, internal_error_handler)
    application.include_router(create_router(configured))
    return application
