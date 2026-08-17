from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .models import ProblemDetail


class ApiError(Exception):
    def __init__(self, status: int, code: str, title: str, detail: str) -> None:
        self.status = status
        self.code = code
        self.title = title
        self.detail = detail


def problem_response(request: Request, error: ApiError) -> JSONResponse:
    body = ProblemDetail(
        type=f"https://example.invalid/problems/{error.code.lower().replace('_', '-')}",
        title=error.title,
        status=error.status,
        detail=error.detail,
        code=error.code,
        instance=str(request.url),
    )
    return JSONResponse(
        body.model_dump(by_alias=True),
        status_code=error.status,
        media_type="application/problem+json",
    )


async def api_error_handler(request: Request, error: ApiError) -> JSONResponse:
    return problem_response(request, error)


async def validation_error_handler(
    request: Request, error: RequestValidationError
) -> JSONResponse:
    fields = ", ".join(
        str(item) for issue in error.errors() for item in issue.get("loc", ())[1:]
    )
    return problem_response(
        request,
        ApiError(422, "INVALID_QUERY", "유효하지 않은 요청", f"입력값을 확인해 주세요: {fields}"),
    )


async def internal_error_handler(request: Request, error: Exception) -> JSONResponse:
    return problem_response(
        request,
        ApiError(500, "INTERNAL_ERROR", "내부 서버 오류", "요청을 처리하지 못했습니다."),
    )
