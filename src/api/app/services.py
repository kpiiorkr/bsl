from datetime import date, datetime

from .errors import ApiError
from .models import (
    MealItem,
    MealSearchResponse,
    SchoolSearchResponse,
    SchoolSummary,
    SelectedSchool,
)
from .neis import NeisClient, split_dishes


class SchoolService:
    def __init__(self, client: NeisClient) -> None:
        self.client = client

    async def search(self, query: str, limit: int) -> SchoolSearchResponse:
        query = query.strip()
        if len(query) < 2:
            raise ApiError(422, "INVALID_QUERY", "유효하지 않은 검색어", "학교 이름을 두 글자 이상 입력해 주세요.")
        rows, total = await self.client.school_info(query)
        items: list[SchoolSummary] = []
        try:
            for row in rows[:limit]:
                required = (
                    row["ATPT_OFCDC_SC_CODE"],
                    row["SD_SCHUL_CODE"],
                    row["SCHUL_NM"],
                )
                if not all(isinstance(value, str) and value for value in required):
                    raise ValueError("invalid required school field")
                items.append(SchoolSummary(
                    office_code=required[0],
                    school_code=required[1],
                    name=required[2],
                    school_type=_nullable_string(row.get("SCHUL_KND_SC_NM")),
                    region=_nullable_string(row.get("LCTN_SC_NM")),
                    address=" ".join(
                        part.strip() for part in (row.get("ORG_RDNMA"), row.get("ORG_RDNDA"))
                        if isinstance(part, str) and part.strip()
                    ) or None,
                ))
        except (KeyError, ValueError) as exc:
            raise ApiError(
                502, "UPSTREAM_ERROR", "외부 서비스 오류",
                "NEIS 학교 정보 응답 형식이 올바르지 않습니다.",
            ) from exc
        return SchoolSearchResponse(items=items, has_more=total > limit or len(rows) > limit)


class MealService:
    def __init__(self, client: NeisClient) -> None:
        self.client = client

    async def search(
        self, office_code: str, school_code: str, from_date: date, to_date: date
    ) -> MealSearchResponse:
        if to_date < from_date or (to_date - from_date).days >= 31:
            raise ApiError(
                422, "INVALID_DATE_RANGE", "유효하지 않은 날짜 범위",
                "종료일은 시작일 이후여야 하며 조회 기간은 시작일을 포함해 최대 31일입니다.",
            )
        rows = await self.client.meals(
            office_code, school_code, from_date.strftime("%Y%m%d"), to_date.strftime("%Y%m%d")
        )
        items: list[MealItem] = []
        for row in rows:
            if row.get("MMEAL_SC_NM") != "중식":
                continue
            name = row.get("SCHUL_NM")
            meal_date_value = row.get("MLSV_YMD")
            dish_value = row.get("DDISH_NM")
            calories = row.get("CAL_INFO")
            if (
                not isinstance(name, str)
                or not name
                or not isinstance(meal_date_value, str)
                or not isinstance(dish_value, str)
                or (calories is not None and not isinstance(calories, str))
            ):
                raise ApiError(
                    502, "UPSTREAM_ERROR", "외부 서비스 오류",
                    "NEIS 급식 정보 응답 형식이 올바르지 않습니다.",
                )
            dishes = split_dishes(dish_value)
            if not dishes:
                continue
            try:
                meal_date = datetime.strptime(meal_date_value, "%Y%m%d").date()
            except ValueError as exc:
                raise ApiError(502, "UPSTREAM_ERROR", "외부 서비스 오류", "NEIS 급식 날짜 형식이 올바르지 않습니다.") from exc
            items.append(MealItem(date=meal_date, dishes=dishes, calories=calories))
        items.sort(key=lambda item: item.date)
        name = next((str(row["SCHUL_NM"]) for row in rows if row.get("SCHUL_NM")), "")
        return MealSearchResponse(
            school=SelectedSchool(office_code=office_code, school_code=school_code, name=name),
            from_=from_date,
            to=to_date,
            items=items,
        )


def _nullable_string(value: object) -> str | None:
    return value if isinstance(value, str) and value else None
