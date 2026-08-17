import re
from datetime import date

from fastapi import APIRouter, Query

from .config import Settings
from .errors import ApiError
from .models import HealthResponse, MealSearchResponse, SchoolSearchResponse
from .neis import NeisClient
from .services import MealService, SchoolService

_CODE = re.compile(r"^\S+$")


def create_router(settings: Settings) -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.get("/schools", operation_id="searchSchools", response_model=SchoolSearchResponse)
    async def search_schools(
        query: str = Query(), limit: int = Query(default=20, ge=1, le=20)
    ) -> SchoolSearchResponse:
        async with NeisClient(settings) as client:
            return await SchoolService(client).search(query, limit)

    @router.get("/meals", operation_id="getMeals", response_model=MealSearchResponse)
    async def get_meals(
        office_code: str = Query(alias="officeCode"),
        school_code: str = Query(alias="schoolCode"),
        from_date: date = Query(alias="from"),
        to_date: date = Query(alias="to"),
    ) -> MealSearchResponse:
        if not _CODE.fullmatch(office_code) or not _CODE.fullmatch(school_code):
            raise ApiError(422, "INVALID_QUERY", "유효하지 않은 학교 코드", "학교 코드는 비어 있거나 공백을 포함할 수 없습니다.")
        async with NeisClient(settings) as client:
            return await MealService(client).search(
                office_code, school_code, from_date, to_date
            )

    @router.get("/health", operation_id="getHealth", response_model=HealthResponse)
    async def get_health() -> HealthResponse:
        return HealthResponse()

    return router
